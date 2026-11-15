package com.mahie.momentum

import android.content.ActivityNotFoundException
import android.content.Context
import android.content.Intent
import android.provider.CalendarContract
import android.widget.Toast
import androidx.annotation.DrawableRes
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.material3.Icon
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import java.time.LocalDate
import java.time.ZoneOffset

object CalendarHelper {
    /**
     * Opens the phone's calendar app with the event pre-filled as an all-day event
     * on the exact date(s) shown on the card. The event details become the description.
     * No calendar permission is needed: the user just taps Save in their calendar app.
     */
    fun add(ctx: Context, title: String, start: LocalDate, end: LocalDate, details: String) {
        val begin = start.atStartOfDay().toInstant(ZoneOffset.UTC).toEpochMilli()
        val finish = end.plusDays(1).atStartOfDay().toInstant(ZoneOffset.UTC).toEpochMilli() // end is exclusive
        val intent = Intent(Intent.ACTION_INSERT)
            .setData(CalendarContract.Events.CONTENT_URI)
            .putExtra(CalendarContract.Events.TITLE, title)
            .putExtra(CalendarContract.Events.DESCRIPTION, details)
            .putExtra(CalendarContract.EXTRA_EVENT_ALL_DAY, true)
            .putExtra(CalendarContract.EXTRA_EVENT_BEGIN_TIME, begin)
            .putExtra(CalendarContract.EXTRA_EVENT_END_TIME, finish)
            .addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
        try {
            ctx.startActivity(intent)
        } catch (e: ActivityNotFoundException) {
            Toast.makeText(ctx, "No calendar app found on this phone", Toast.LENGTH_SHORT).show()
        }
    }
}

/** Small pill button used on the back of a card ("Add to calendar", "Show more"). */
@Composable
internal fun CardAction(text: String, @DrawableRes icon: Int? = null, onClick: () -> Unit) {
    val p = LocalPal.current
    Row(
        Modifier.clip(CircleShape).background(p.sel).clickable(onClick = onClick)
            .padding(horizontal = 12.dp, vertical = 7.dp),
        verticalAlignment = Alignment.CenterVertically,
    ) {
        if (icon != null) {
            Icon(painterResource(icon), null, tint = p.fg, modifier = Modifier.size(16.dp))
            Spacer(Modifier.width(6.dp))
        }
        Text(text, color = p.fg, fontSize = 13.sp, fontWeight = FontWeight.SemiBold, maxLines = 1)
    }
}
