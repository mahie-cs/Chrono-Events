package com.mahie.momentum

import android.content.Context
import androidx.annotation.DrawableRes
import androidx.core.content.edit
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import org.json.JSONArray
import java.net.HttpURLConnection
import java.net.URL
import java.time.LocalDate
import java.time.ZoneId
import java.time.format.DateTimeFormatter
import java.util.Locale

enum class Status(val label: String) { UPCOMING("Upcoming"), ONGOING("Ongoing"), PAST("Past") }

enum class Section(val key: String, val label: String, @param:DrawableRes val icon: Int) {
    EXAMS("exam", "Exams", R.drawable.ic_exams),
    ASSIGNMENTS("assignment", "Assignments", R.drawable.ic_assignments),
    EVENTS("event", "Events", R.drawable.ic_events),
    SCHEDULE("schedule", "Schedule", R.drawable.ic_schedule);

    companion object {
        fun forType(type: String) = entries.firstOrNull { it != SCHEDULE && it.key == type.lowercase() } ?: EVENTS
    }
}

private val DateFmt = DateTimeFormatter.ofPattern("d MMM yyyy", Locale.ENGLISH)

data class Event(
    val type: String,
    val name: String,
    val start: LocalDate?,
    val end: LocalDate?,
    val isPostponed: Boolean,
    val isCancelled: Boolean,
    val dateTba: Boolean,
    val details: String,
) {
    val section get() = Section.forType(type)
    val id get() = "${type.lowercase()}|$name"
    val dateLabel: String get() = when {
        isCancelled -> "Cancelled"
        isPostponed -> "Postponed"
        dateTba -> "Date TBA"
        start == null -> "Upcoming"
        (end != null) && (end != start) -> "${start.format(DateFmt)} – ${end.format(DateFmt)}"
        else -> start.format(DateFmt)
    }

    fun statusOn(today: LocalDate) = when {
        isCancelled -> Status.UPCOMING
        isPostponed -> Status.UPCOMING
        start == null -> Status.UPCOMING
        today < start -> Status.UPCOMING
        today > end -> Status.PAST
        else -> Status.ONGOING
    }
}

/** Everything is judged in Bangladesh time, same as the website. */
val DHAKA: ZoneId = ZoneId.of("Asia/Dhaka")

class Changes(val added: List<Event>, val changed: List<Event>, val removed: Int)

object EventRepository {
    // The github.com/.../blob/... link is an HTML page; the raw host serves the actual JSON.
    private const val SOURCE_URL =
        "https://raw.githubusercontent.com/mahie-cs/Chrono-Events/main/events.json"

    suspend fun fetch(): String = withContext(Dispatchers.IO) {
        val conn = URL(SOURCE_URL).openConnection() as HttpURLConnection
        try {
            conn.connectTimeout = 10_000
            conn.readTimeout = 10_000
            conn.useCaches = false
            check(conn.responseCode == 200) { "HTTP ${conn.responseCode}" }
            conn.inputStream.bufferedReader().use { it.readText() }
        } finally {
            conn.disconnect()
        }
    }

    private val DateRegex = Regex("""\d{4}-\d{2}-\d{2}""")

    /** A real YYYY-MM-DD date, or null for anything else (typos, wrong format, impossible dates). */
    private fun parseDate(s: String): LocalDate? =
        if (DateRegex.matches(s)) runCatching { LocalDate.parse(s) }.getOrNull() else null

    fun parse(json: String): List<Event> {
        val arr = JSONArray(json)
        return (0 until arr.length()).mapNotNull { i ->
            runCatching {
                val o = arr.getJSONObject(i)
                val dateStr = if (o.isNull("date")) "" else o.optString("date").trim()
                val isPostponed = dateStr == "-1"
                val isCancelled = dateStr == "0"
                val start = if (!isPostponed && !isCancelled) parseDate(dateStr) else null
                val dateTba = !isPostponed && !isCancelled && dateStr.isNotEmpty() && start == null
                val endStr = if (o.isNull("endDate")) "" else o.optString("endDate").trim()
                val end = start?.let { s -> parseDate(endStr)?.takeIf { it > s } ?: s }
                Event(
                    type = o.optString("type", "event"),
                    name = o.getString("name"),
                    start = start,
                    end = end,
                    isPostponed = isPostponed,
                    isCancelled = isCancelled,
                    dateTba = dateTba,
                    details = o.optString("details"),
                )
            }.getOrNull()
        }
    }

    fun diff(old: List<Event>, new: List<Event>): Changes {
        val oldById = old.associateBy { it.id }
        val newIds = new.mapTo(HashSet()) { it.id }
        return Changes(
            added = new.filter { it.id !in oldById },
            changed = new.filter { e -> oldById[e.id]?.let { it != e } == true },
            removed = old.count { it.id !in newIds },
        )
    }

    private fun prefs(ctx: Context) = ctx.getSharedPreferences("momentum", Context.MODE_PRIVATE)
    fun cached(ctx: Context): String? = prefs(ctx).getString("json", null)
    fun save(ctx: Context, json: String) = prefs(ctx).edit { putString("json", json) }
}
