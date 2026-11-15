package com.mahie.momentum

import android.content.Context
import androidx.core.content.edit
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import org.json.JSONObject
import java.net.HttpURLConnection
import java.net.URL
import java.time.DayOfWeek
import java.util.Locale

const val UNKNOWN_TIME = Int.MAX_VALUE
private const val DEFAULT_CLASS_MINUTES = 50
private val LabRegex = Regex("""\blab\b""", RegexOption.IGNORE_CASE)
private val LabTagRegex = Regex("""\s*\(\s*lab\s*\)""", RegexOption.IGNORE_CASE)

private fun clock(minutes: Int, withSuffix: Boolean): String {
    val h = minutes / 60
    val h12 = (h % 12).let { if (it == 0) 12 else it }
    val base = String.format(Locale.ENGLISH, "%d:%02d", h12, minutes % 60)
    return if (withSuffix) base + (if (h < 12) " AM" else " PM") else base
}

/**
 * One class. [minutes] / [endMinutes] are minutes after midnight (UNKNOWN_TIME if missing or unreadable),
 * [time] is the key exactly as written in schedule.json, e.g. "9:50-10:40".
 */
data class ClassSlot(val minutes: Int, val endMinutes: Int, val time: String, val name: String) {
    val known get() = minutes != UNKNOWN_TIME

    /** A lab if the name contains the word "lab", e.g. "Chemistry (Lab)". Everything else is a class. */
    val isLab: Boolean get() = LabRegex.containsMatchIn(name)

    /** Name without a trailing "(Lab)", because the Lab badge already says it. */
    val title: String get() = name.replace(LabTagRegex, "").trim().ifEmpty { name }

    val hasEnd get() = known && endMinutes != UNKNOWN_TIME

    /** When the class ends. Without an end time in the key, a class is assumed to last 50 minutes. */
    val end get() = if (hasEnd) endMinutes else if (known) minutes + DEFAULT_CLASS_MINUTES else UNKNOWN_TIME

    /** "9:50 – 10:40 AM" (full, used in the Today view) */
    val label: String
        get() = when {
            !known -> time
            !hasEnd -> clock(minutes, true)
            (minutes / 60 < 12) == (endMinutes / 60 < 12) -> clock(minutes, false) + " – " + clock(endMinutes, true)
            else -> clock(minutes, true) + " – " + clock(endMinutes, true)
        }

    /** "9:50-10:40" (compact, used in the week view) */
    val short: String
        get() = when {
            !known -> time
            !hasEnd -> clock(minutes, false)
            else -> clock(minutes, false) + "-" + clock(endMinutes, false)
        }
}

data class Schedule(val days: Map<DayOfWeek, List<ClassSlot>>) {
    fun on(day: DayOfWeek): List<ClassSlot> = days[day].orEmpty()
}

object ScheduleRepository {
    private const val SOURCE_URL =
        "https://raw.githubusercontent.com/mahie-cs/Chrono-Events/main/schedule.json"

    /** Week order shown in the app (Bangladesh week: Saturday first). Change it here if you prefer another start day. */
    val WEEKEND = setOf(DayOfWeek.FRIDAY, DayOfWeek.SATURDAY)

    val WEEK = listOf(
        DayOfWeek.SATURDAY, DayOfWeek.SUNDAY, DayOfWeek.MONDAY, DayOfWeek.TUESDAY,
        DayOfWeek.WEDNESDAY, DayOfWeek.THURSDAY, DayOfWeek.FRIDAY,
    )

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

    private fun dayOf(key: String): DayOfWeek? {
        val k = key.trim().lowercase(Locale.ENGLISH)
        return DayOfWeek.values().firstOrNull {
            val n = it.name.lowercase(Locale.ENGLISH)
            n == k || n.take(3) == k
        }
    }

    private val TimeRegex = Regex("""^(\d{1,2}):(\d{2})\s*([ap]m)?$""", RegexOption.IGNORE_CASE)

    private val RangeRegex = Regex("""^(.+?)\s*[-–—]\s*(.+)$""")

    /** "9:50-10:40" -> (start, end). A single time like "9:50" is still accepted (end unknown). */
    private fun rangeOf(key: String): Pair<Int, Int> {
        val m = RangeRegex.matchEntire(key.trim()) ?: return minutesOf(key) to UNKNOWN_TIME
        val start = minutesOf(m.groupValues[1])
        val end = minutesOf(m.groupValues[2])
        val ok = start != UNKNOWN_TIME && end != UNKNOWN_TIME && end > start
        return start to (if (ok) end else UNKNOWN_TIME)
    }

    /**
     * "9:50" -> 9:50, "13:30" -> 13:30, "1:30" -> 13:30 (hours 1-6 without AM/PM are read as afternoon),
     * "9:50 AM" / "1:30 PM" are also understood.
     */
    private fun minutesOf(t: String): Int {
        val m = TimeRegex.matchEntire(t.trim()) ?: return UNKNOWN_TIME
        var h = m.groupValues[1].toInt()
        val min = m.groupValues[2].toInt()
        val ap = m.groupValues[3].lowercase(Locale.ENGLISH)
        if (h > 23 || min > 59) return UNKNOWN_TIME
        if (ap == "pm" && h < 12) h += 12
        else if (ap == "am" && h == 12) h = 0
        else if (ap.isEmpty() && h in 1..6) h += 12
        return h * 60 + min
    }

    fun parse(json: String): Schedule {
        val root = JSONObject(json)
        val days = mutableMapOf<DayOfWeek, List<ClassSlot>>()
        for (key in root.keys()) {
            val day = dayOf(key) ?: continue
            val obj = root.optJSONObject(key) ?: continue
            val slots = mutableListOf<ClassSlot>()
            for (time in obj.keys()) {
                val name = obj.optString(time).trim()
                if (name.isNotEmpty()) {
                    val (start, end) = rangeOf(time)
                    slots += ClassSlot(start, end, time.trim(), name)
                }
            }
            days[day] = slots.sortedWith(compareBy({ it.minutes }, { it.name }))
        }
        return Schedule(days)
    }

    fun changedDays(old: Schedule, new: Schedule): List<DayOfWeek> =
        WEEK.filter { old.on(it) != new.on(it) }

    private fun prefs(ctx: Context) = ctx.getSharedPreferences("momentum", Context.MODE_PRIVATE)
    fun cached(ctx: Context): String? = prefs(ctx).getString("schedule_json", null)
    fun save(ctx: Context, json: String) = prefs(ctx).edit { putString("schedule_json", json) }
}
