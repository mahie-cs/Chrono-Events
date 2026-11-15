package com.mahie.momentum

import android.Manifest
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.content.Context
import android.content.Intent
import android.content.pm.PackageManager
import android.os.Build
import androidx.core.app.NotificationCompat
import androidx.core.app.NotificationManagerCompat

object Notifier {
    private const val CHANNEL = "event_updates"

    fun ensureChannel(ctx: Context) {
        val ch = NotificationChannel(CHANNEL, "Event updates", NotificationManager.IMPORTANCE_HIGH).apply {
            description = "New and changed exams, assignments and events"
        }
        ctx.getSystemService(NotificationManager::class.java).createNotificationChannel(ch)
    }

    fun canNotify(ctx: Context) =
        (Build.VERSION.SDK_INT < 33) ||
            (ctx.checkSelfPermission(Manifest.permission.POST_NOTIFICATIONS) == PackageManager.PERMISSION_GRANTED)

    /** Heads-up (pop-up) notification that expands to show the full details. */
    fun post(ctx: Context, id: Int, title: String, summary: String, full: String) {
        if (!canNotify(ctx)) return
        ensureChannel(ctx)
        val open = PendingIntent.getActivity(
            ctx, 0, Intent(ctx, MainActivity::class.java).addFlags(Intent.FLAG_ACTIVITY_SINGLE_TOP),
            PendingIntent.FLAG_IMMUTABLE or PendingIntent.FLAG_UPDATE_CURRENT,
        )
        val n = NotificationCompat.Builder(ctx, CHANNEL)
            .setSmallIcon(R.drawable.ic_stat)
            .setContentTitle(title)
            .setContentText(summary)
            .setStyle(NotificationCompat.BigTextStyle().bigText(full))
            .setPriority(NotificationCompat.PRIORITY_HIGH)
            .setDefaults(NotificationCompat.DEFAULT_ALL)
            .setCategory(NotificationCompat.CATEGORY_EVENT)
            .setAutoCancel(true)
            .setContentIntent(open)
            .build()
        try { NotificationManagerCompat.from(ctx).notify(id, n) } catch (_: SecurityException) {}
    }

    fun postEvent(ctx: Context, e: Event, isNew: Boolean) {
        val kind = e.type.lowercase().replaceFirstChar { it.uppercase() }
        post(
            ctx, e.id.hashCode(),
            title = (if (isNew) "New $kind: " else "Updated $kind: ") + e.name,
            summary = "${e.dateLabel} · ${e.details}",
            full = "${e.dateLabel}\n\n${e.details}",
        )
    }
}
