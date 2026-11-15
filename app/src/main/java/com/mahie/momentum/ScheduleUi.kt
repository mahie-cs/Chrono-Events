package com.mahie.momentum

import androidx.compose.animation.animateColorAsState
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.produceState
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.alpha
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.semantics.Role
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.TextUnit
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import kotlinx.coroutines.delay
import java.time.DayOfWeek
import java.time.LocalDateTime
import java.time.format.DateTimeFormatter
import java.time.format.TextStyle
import java.util.Locale

private val LabColor = Color(0xFFAF52DE)

@Composable
private fun KindBadge(lab: Boolean) {
    val p = LocalPal.current
    if (lab) {
        Text(
            "Lab", color = LabColor, fontSize = 10.sp, fontWeight = FontWeight.SemiBold,
            modifier = Modifier.background(LabColor.copy(alpha = .14f), CircleShape).padding(horizontal = 9.dp, vertical = 2.dp),
        )
    } else {
        val green = if (p.dark) Color(0xFF8CF5A6) else Color(0xFF1B8A3A)
        Text(
            "Class", color = green, fontSize = 10.sp, fontWeight = FontWeight.SemiBold,
            modifier = Modifier.background(green.copy(alpha = .14f), CircleShape).padding(horizontal = 9.dp, vertical = 2.dp),
        )
    }
}

@Composable
private fun HairLine() {
    Box(Modifier.fillMaxWidth().height(1.dp).background(LocalPal.current.line))
}

/** One class or lab = one row: name on top, time + badge underneath. */
@Composable
private fun ClassLine(slot: ClassSlot, time: String, titleSize: TextUnit, trailing: @Composable () -> Unit = {}) {
    val p = LocalPal.current
    Column(Modifier.fillMaxWidth()) {
        Text(
            slot.title, color = p.fg, fontSize = titleSize, fontWeight = FontWeight.SemiBold,
            maxLines = 1, overflow = TextOverflow.Ellipsis,
        )
        Row(Modifier.padding(top = 3.dp), verticalAlignment = Alignment.CenterVertically) {
            Text(time, color = p.mut, fontSize = 12.sp)
            Spacer(Modifier.width(8.dp))
            KindBadge(slot.isLab)
            Spacer(Modifier.weight(1f))
            trailing()
        }
    }
}

@Composable
private fun Tag(text: String, color: Color) {
    Text(
        text, color = color, fontSize = 11.sp, fontWeight = FontWeight.SemiBold,
        modifier = Modifier.background(color.copy(alpha = .13f), CircleShape).padding(horizontal = 9.dp, vertical = 2.dp),
    )
}

@Composable
fun ScheduleContent(schedule: Schedule?) {
    val p = LocalPal.current
    var week by rememberSaveable { mutableStateOf(false) }
    val now by produceState(LocalDateTime.now(DHAKA)) {
        while (true) {
            delay(30_000)
            value = LocalDateTime.now(DHAKA)
        }
    }

    Column(
        Modifier.fillMaxSize().verticalScroll(rememberScrollState())
            .padding(start = 12.dp, end = 16.dp, top = 4.dp, bottom = 130.dp),
        verticalArrangement = Arrangement.spacedBy(14.dp),
    ) {
        ViewToggle(week) { week = it }
        when {
            schedule == null -> Text("No schedule published yet. Pull down to refresh.", color = p.mut, fontSize = 15.sp)
            week -> WeekView(schedule, now.dayOfWeek)
            else -> TodayView(schedule, now)
        }
    }
}

@Composable
private fun ViewToggle(week: Boolean, onChange: (Boolean) -> Unit) {
    val p = LocalPal.current
    Row(Modifier.fillMaxWidth().background(p.sel, CircleShape).padding(3.dp)) {
        listOf(false to "Today", true to "Whole week").forEach { (isWeek, label) ->
            val on = isWeek == week
            val bg by animateColorAsState(if (on) p.card else Color.Transparent, label = "toggle")
            Box(
                Modifier.weight(1f).clip(CircleShape).background(bg)
                    .clickable(role = Role.Tab) { onChange(isWeek) }.padding(vertical = 9.dp),
                contentAlignment = Alignment.Center,
            ) {
                Text(label, color = if (on) p.fg else p.mut, fontSize = 14.sp, fontWeight = FontWeight.SemiBold)
            }
        }
    }
}

@Composable
private fun TodayView(schedule: Schedule, now: LocalDateTime) {
    val p = LocalPal.current
    val shape = RoundedCornerShape(22.dp)
    val slots = schedule.on(now.dayOfWeek)
    val nowMin = now.hour * 60 + now.minute
    val nextIdx = slots.indexOfFirst { it.known && it.minutes > nowMin }

    fun state(i: Int): Int { // 0 = done, 1 = now, 2 = next, 3 = later
        val s = slots[i]
        if (!s.known) return 3
        val nextStart = slots.getOrNull(i + 1)?.takeIf { it.known }?.minutes ?: Int.MAX_VALUE
        val end = if (s.hasEnd) s.endMinutes else minOf(s.end, nextStart)
        return when {
            nowMin >= end -> 0
            nowMin >= s.minutes -> 1
            i == nextIdx -> 2
            else -> 3
        }
    }

    Column(verticalArrangement = Arrangement.spacedBy(12.dp)) {
        Column(Modifier.padding(horizontal = 4.dp)) {
            Text(
                now.dayOfWeek.getDisplayName(TextStyle.FULL, Locale.ENGLISH),
                color = p.fg, fontSize = 26.sp, fontWeight = FontWeight.Bold, letterSpacing = (-0.5).sp,
            )
            Text(now.format(DateTimeFormatter.ofPattern("d MMM yyyy", Locale.ENGLISH)), color = p.mut, fontSize = 14.sp)
        }

        Column(Modifier.fillMaxWidth().background(p.card, shape).border(1.dp, p.line, shape).clip(shape)) {
            if (slots.isEmpty()) {
                Text(
                    if (now.dayOfWeek in ScheduleRepository.WEEKEND) "It's the weekend. No classes today." else "No classes today.",
                    color = p.mut, fontSize = 16.sp, modifier = Modifier.padding(18.dp),
                )
            } else {
                slots.indices.forEach { i ->
                    if (i > 0) HairLine()
                    val st = state(i)
                    Box(
                        Modifier.fillMaxWidth()
                            .background(if (st == 1) p.on.copy(alpha = .08f) else Color.Transparent)
                            .alpha(if (st == 0) .5f else 1f)
                            .padding(horizontal = 16.dp, vertical = 13.dp),
                    ) {
                        ClassLine(slots[i], slots[i].label, 17.sp) {
                            when (st) {
                                1 -> Tag("Now", p.on)
                                2 -> Tag("Next", p.up)
                            }
                        }
                    }
                }
            }
        }

        if (slots.isNotEmpty() && slots.indices.all { state(it) == 0 }) {
            Text("That's all for today.", color = p.mut, fontSize = 14.sp, modifier = Modifier.padding(start = 4.dp))
        }
    }
}

/** Whole week in one card: a row per day, and inside it one clean row per class or lab. */
@Composable
private fun WeekView(schedule: Schedule, today: DayOfWeek) {
    val p = LocalPal.current
    val shape = RoundedCornerShape(22.dp)
    Column(Modifier.fillMaxWidth().background(p.card, shape).border(1.dp, p.line, shape).clip(shape)) {
        ScheduleRepository.WEEK.forEachIndexed { idx, day ->
            if (idx > 0) HairLine()
            val isToday = day == today
            val slots = schedule.on(day)
            Row(
                Modifier.fillMaxWidth()
                    .background(if (isToday) p.up.copy(alpha = .07f) else Color.Transparent)
                    .padding(horizontal = 14.dp, vertical = 11.dp),
            ) {
                Text(
                    day.getDisplayName(TextStyle.SHORT, Locale.ENGLISH),
                    color = if (isToday) p.up else p.fg, fontSize = 14.sp, fontWeight = FontWeight.Bold,
                    modifier = Modifier.width(40.dp).padding(top = 1.dp),
                )
                if (slots.isEmpty()) {
                    Text(
                        if (day in ScheduleRepository.WEEKEND) "Weekend" else "No classes",
                        color = p.mut, fontSize = 14.sp, modifier = Modifier.padding(top = 1.dp),
                    )
                } else {
                    Column(Modifier.weight(1f), verticalArrangement = Arrangement.spacedBy(10.dp)) {
                        slots.forEach { ClassLine(it, it.short, 14.sp) }
                    }
                }
            }
        }
    }
}
