package com.mahie.momentum

import android.annotation.SuppressLint
import android.content.Context
import android.content.Intent
import android.os.PowerManager
import android.provider.Settings
import androidx.annotation.DrawableRes
import androidx.core.net.toUri
import androidx.compose.animation.animateColorAsState
import androidx.compose.animation.core.Spring
import androidx.compose.animation.core.animateFloatAsState
import androidx.compose.animation.core.spring
import androidx.compose.foundation.*
import androidx.compose.foundation.interaction.MutableInteractionSource
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.*
import androidx.compose.material3.pulltorefresh.PullToRefreshBox
import androidx.compose.runtime.*
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.shadow
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.graphicsLayer
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.semantics.Role
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import kotlinx.coroutines.launch
import java.time.LocalDate

// ───────────────────────── palette (from the website's styles.css) ─────────────────────────

@Immutable
class Pal(
    val bg: Color, val card: Color, val fg: Color, val mut: Color, val line: Color,
    val glass: Color, val edge: Color, val sel: Color, val up: Color, val on: Color, val past: Color,
    val dark: Boolean = false,
) {
    fun statusColor(s: Status) = when (s) { Status.UPCOMING -> up; Status.ONGOING -> on; Status.PAST -> past }
}

val LightPal = Pal(
    bg = Color(0xFFF5F5F7), card = Color.White, fg = Color(0xFF1D1D1F), mut = Color(0xFF6E6E73),
    line = Color(0x14000000), glass = Color(0xE6FFFFFF), edge = Color(0xB3FFFFFF), sel = Color(0x12000000),
    up = Color(0xFF0071E3), on = Color(0xFF248A3D), past = Color(0xFF8E8E93),
)
val DarkPal = Pal(
    bg = Color.Black, card = Color(0xFF1C1C1E), fg = Color(0xFFF5F5F7), mut = Color(0xFF98989D),
    line = Color(0x1AFFFFFF), glass = Color(0xE62A2A2E), edge = Color(0x24FFFFFF), sel = Color(0x24FFFFFF),
    up = Color(0xFF2997FF), on = Color(0xFF30D158), past = Color(0xFF8E8E93), dark = true,
)
val LocalPal = staticCompositionLocalOf { LightPal }

private val SoftShadow = Color(0x33000000)
private const val LIM = 110

// ───────────────────────── shared pieces ─────────────────────────

enum class Dest(val label: String, @param:DrawableRes val icon: Int) {
    HOME("Home", R.drawable.ic_home),
    UPDATES("Updates", R.drawable.ic_download),
    ABOUT("About", R.drawable.ic_info),
}

@Composable
private fun ThemeButton(dark: Boolean, onClick: () -> Unit) {
    val p = LocalPal.current
    var turns by remember { mutableIntStateOf(0) }
    val rot by animateFloatAsState(turns * 360f, spring(0.8f, Spring.StiffnessMedium), label = "theme")
    Box(
        Modifier.size(44.dp)
            .shadow(6.dp, CircleShape, ambientColor = SoftShadow, spotColor = SoftShadow)
            .background(p.glass, CircleShape).border(1.dp, p.edge, CircleShape).clip(CircleShape)
            .clickable(role = Role.Button) { turns++; onClick() },
        contentAlignment = Alignment.Center,
    ) {
        Icon(
            painterResource(if (dark) R.drawable.ic_moon else R.drawable.ic_sun),
            contentDescription = if (dark) "Switch to light mode" else "Switch to dark mode",
            tint = p.fg, modifier = Modifier.size(22.dp).graphicsLayer { rotationZ = rot },
        )
    }
}

@Composable
private fun Header(title: String, sub: String, vm: MainViewModel) {
    val p = LocalPal.current
    Column(Modifier.padding(horizontal = 20.dp).padding(top = 24.dp, bottom = 8.dp)) {
        Row(verticalAlignment = Alignment.CenterVertically) {
            Text(
                title, color = p.fg, fontSize = 38.sp, lineHeight = 42.sp, fontWeight = FontWeight.Bold,
                letterSpacing = (-1).sp, modifier = Modifier.weight(1f),
            )
            ThemeButton(vm.dark) { vm.toggleDark() }
        }
        Text(sub, color = p.mut, fontSize = 16.sp, modifier = Modifier.padding(top = 6.dp))
    }
}

@Composable
private fun Pill(text: String, color: Color, modifier: Modifier = Modifier) {
    Text(
        text, color = color, fontSize = 13.sp, fontWeight = FontWeight.SemiBold,
        modifier = modifier.background(color.copy(alpha = .13f), CircleShape).padding(horizontal = 11.dp, vertical = 4.dp),
    )
}

@Composable
private fun PrimaryButton(text: String, enabled: Boolean = true, onClick: () -> Unit) {
    val p = LocalPal.current
    Box(
        Modifier.fillMaxWidth().clip(CircleShape)
            .background(if (enabled) p.up else p.sel)
            .clickable(enabled = enabled, role = Role.Button, onClick = onClick)
            .padding(vertical = 14.dp),
        contentAlignment = Alignment.Center,
    ) {
        Text(text, color = if (enabled) Color.White else p.mut, fontWeight = FontWeight.SemiBold, fontSize = 16.sp)
    }
}

@Composable
private fun SoftCard(modifier: Modifier = Modifier, content: @Composable ColumnScope.() -> Unit) {
    val p = LocalPal.current
    val shape = RoundedCornerShape(22.dp)
    Column(
        modifier.fillMaxWidth().background(p.card, shape).border(1.dp, p.line, shape).padding(20.dp),
        content = content,
    )
}

// ───────────────────────── bottom navigation: Home / Updates / About ─────────────────────────

@Composable
fun BottomNav(sel: Dest, badge: Boolean, onSelect: (Dest) -> Unit, modifier: Modifier = Modifier) {
    val p = LocalPal.current
    Row(
        modifier.navigationBarsPadding().padding(bottom = 16.dp)
            .widthIn(max = 420.dp).fillMaxWidth(0.92f)
            .shadow(16.dp, CircleShape, ambientColor = SoftShadow, spotColor = SoftShadow)
            .background(p.glass, CircleShape).border(1.dp, p.edge, CircleShape).padding(5.dp),
    ) {
        Dest.entries.forEach { d ->
            val on = d == sel
            val bg by animateColorAsState(if (on) p.sel else Color.Transparent, label = "navbg")
            Column(
                Modifier.weight(1f).clip(CircleShape).background(bg)
                    .clickable(role = Role.Tab) { onSelect(d) }.padding(vertical = 8.dp),
                horizontalAlignment = Alignment.CenterHorizontally,
            ) {
                Box {
                    Icon(painterResource(d.icon), null, tint = if (on) p.fg else p.mut, modifier = Modifier.size(24.dp))
                    if (badge && d == Dest.UPDATES) {
                        Box(Modifier.size(9.dp).align(Alignment.TopEnd).background(Color(0xFFFF453A), CircleShape))
                    }
                }
                Text(d.label, color = if (on) p.fg else p.mut, fontSize = 11.sp, fontWeight = FontWeight.SemiBold)
            }
        }
    }
}

// ───────────────────────── Home: vertical section rail (top-left) + event cards ─────────────────────────

@Composable
private fun SideRail(sel: Section, onSelect: (Section) -> Unit) {
    val p = LocalPal.current
    Column(
        Modifier.padding(start = 12.dp, top = 8.dp).width(80.dp)
            .shadow(10.dp, RoundedCornerShape(36.dp), ambientColor = SoftShadow, spotColor = SoftShadow)
            .background(p.glass, RoundedCornerShape(36.dp)).border(1.dp, p.edge, RoundedCornerShape(36.dp))
            .padding(5.dp),
        verticalArrangement = Arrangement.spacedBy(4.dp),
    ) {
        Section.entries.forEach { s ->
            val on = s == sel
            val bg by animateColorAsState(if (on) p.sel else Color.Transparent, label = "railbg")
            Column(
                Modifier.fillMaxWidth().clip(RoundedCornerShape(30.dp)).background(bg)
                    .clickable(role = Role.Tab) { onSelect(s) }.padding(vertical = 12.dp),
                horizontalAlignment = Alignment.CenterHorizontally,
            ) {
                Icon(painterResource(s.icon), null, tint = if (on) p.fg else p.mut, modifier = Modifier.size(24.dp))
                Spacer(Modifier.height(3.dp))
                Text(
                    s.label, color = if (on) p.fg else p.mut, fontSize = 10.sp, fontWeight = FontWeight.SemiBold,
                    maxLines = 1, textAlign = TextAlign.Center,
                )
            }
        }
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun HomeScreen(vm: MainViewModel) {
    val p = LocalPal.current
    var section by rememberSaveable { mutableStateOf(Section.EXAMS) }
    var flippedId by remember { mutableStateOf<String?>(null) }
    var expanded by remember { mutableStateOf<Event?>(null) }

    Column(Modifier.fillMaxSize().statusBarsPadding()) {
        Header("Momentum", "Department of CSE · SIMT Engineering College", vm)
        Row(Modifier.fillMaxSize()) {
            SideRail(section) { section = it; flippedId = null }
            PullToRefreshBox(isRefreshing = vm.refreshing, onRefresh = vm::refresh, modifier = Modifier.fillMaxSize()) {
                if (section == Section.SCHEDULE) {
                    ScheduleContent(vm.schedule)
                } else {
                val today = LocalDate.now(DHAKA)
                val grouped = vm.events.filter { it.section == section }.groupBy { it.statusOn(today) }
                LazyColumn(
                    contentPadding = PaddingValues(start = 12.dp, end = 16.dp, top = 4.dp, bottom = 130.dp),
                    verticalArrangement = Arrangement.spacedBy(14.dp),
                    modifier = Modifier.fillMaxSize(),
                ) {
                    vm.message?.let { msg -> item { Text(msg, color = Color(0xFFFF453A), fontSize = 14.sp) } }
                    Status.entries.forEach { s ->
                        val list = (grouped[s] ?: emptyList()).let { l ->
                            when (s) {
                                Status.UPCOMING -> {
                                    fun group(e: Event) = when {
                                        e.isCancelled -> 4
                                        e.isPostponed -> 3
                                        e.dateTba -> 2
                                        e.start == null -> 1
                                        else -> 0
                                    }
                                    l.sortedWith(
                                        Comparator { a, b ->
                                            val ga = group(a)
                                            val gb = group(b)
                                            when {
                                                ga != gb -> ga.compareTo(gb)
                                                ga == 0 -> {
                                                    val cmp = a.start!!.compareTo(b.start!!)
                                                    if (cmp != 0) cmp else a.name.compareTo(b.name)
                                                }
                                                else -> a.name.compareTo(b.name)
                                            }
                                        },
                                    )
                                }
                                Status.ONGOING -> l.sortedByDescending { it.start }
                                Status.PAST -> l.sortedByDescending { it.end }
                            }
                        }
                        item(key = "h-$s") {
                            Row(Modifier.padding(top = 18.dp), verticalAlignment = Alignment.CenterVertically) {
                                Box(Modifier.size(10.dp).background(p.statusColor(s), CircleShape))
                                Spacer(Modifier.width(9.dp))
                                Text(
                                    "${s.label} ${section.label}", color = p.fg, fontSize = 21.sp,
                                    fontWeight = FontWeight.SemiBold, letterSpacing = (-0.4).sp,
                                    maxLines = 1, overflow = TextOverflow.Ellipsis, modifier = Modifier.weight(1f),
                                )
                                if (list.isNotEmpty()) Text("${list.size}", color = p.mut, fontSize = 14.sp, fontWeight = FontWeight.SemiBold)
                            }
                        }
                        if (list.isEmpty()) {
                            item(key = "e-$s") { Text("No ${s.label.lowercase()} ${section.label.lowercase()}.", color = p.mut) }
                        } else {
                            items(list, key = { "${it.id}|${it.start}" }) { e ->
                                FlipCard(
                                    e, s, flipped = flippedId == e.id,
                                    onFlip = { flippedId = if (flippedId == e.id) null else e.id },
                                    onMore = { expanded = e },
                                )
                            }
                        }
                    }
                }
                }
            }
        }
    }

    expanded?.let { e ->
        val sheetState = rememberModalBottomSheetState(skipPartiallyExpanded = true)
        val scope = rememberCoroutineScope()
        ModalBottomSheet(
            onDismissRequest = { expanded = null },
            sheetState = sheetState,
            containerColor = p.card,
            shape = RoundedCornerShape(topStart = 28.dp, topEnd = 28.dp),
        ) {
            Column(Modifier.padding(horizontal = 24.dp).padding(bottom = 24.dp).navigationBarsPadding()) {
                Text(e.name, color = p.fg, fontSize = 26.sp, lineHeight = 30.sp, fontWeight = FontWeight.Bold, letterSpacing = (-0.5).sp)
                Text(e.dateLabel, color = p.up, fontWeight = FontWeight.SemiBold, modifier = Modifier.padding(top = 6.dp, bottom = 14.dp))
                Text(
                    e.details, color = p.fg, fontSize = 16.sp, lineHeight = 24.sp,
                    modifier = Modifier.heightIn(max = 320.dp).verticalScroll(rememberScrollState()),
                )
                Spacer(Modifier.height(22.dp))
                PrimaryButton("Done") { scope.launch { sheetState.hide() }.invokeOnCompletion { expanded = null } }
            }
        }
    }
}

@OptIn(ExperimentalLayoutApi::class)
@Composable
private fun FlipCard(e: Event, status: Status, flipped: Boolean, onFlip: () -> Unit, onMore: () -> Unit) {
    val p = LocalPal.current
    val c = p.statusColor(status)
    val rot by animateFloatAsState(if (flipped) 180f else 0f, spring(0.85f, Spring.StiffnessLow), label = "flip")
    val shape = RoundedCornerShape(22.dp)
    val long = e.details.length > LIM
    val ctx = LocalContext.current
    val calStart = e.start

    Box(
        Modifier.fillMaxWidth().height(215.dp)
            .graphicsLayer { rotationY = rot; cameraDistance = 14f * density }
            .shadow(3.dp, shape, ambientColor = SoftShadow, spotColor = SoftShadow)
            .background(p.card, shape).border(1.dp, p.line, shape).clip(shape)
            .clickable(interactionSource = remember { MutableInteractionSource() }, indication = null, onClick = onFlip),
    ) {
        if (rot <= 90f) {
            Column(Modifier.fillMaxSize().padding(20.dp)) {
                Text(
                    e.name, color = p.fg, fontSize = 21.sp, lineHeight = 25.sp, fontWeight = FontWeight.SemiBold,
                    letterSpacing = (-0.3).sp, maxLines = 3, overflow = TextOverflow.Ellipsis,
                )
                Spacer(Modifier.weight(1f))
                Pill(e.dateLabel, c)
            }
        } else {
            Column(Modifier.fillMaxSize().graphicsLayer { rotationY = 180f }.padding(20.dp)) { // un-mirror
                Text(e.name, color = p.fg, fontSize = 16.sp, fontWeight = FontWeight.SemiBold, maxLines = 1, overflow = TextOverflow.Ellipsis)
                Spacer(Modifier.height(6.dp))
                Text(
                    if (long) e.details.take(LIM) + "…" else e.details,
                    color = p.mut, fontSize = 14.5.sp, lineHeight = 20.sp,
                    maxLines = if (calStart != null && long) 3 else 4, overflow = TextOverflow.Ellipsis,
                    modifier = Modifier.weight(1f),
                )
                if (calStart != null || long) {
                    FlowRow(
                        horizontalArrangement = Arrangement.spacedBy(8.dp),
                        verticalArrangement = Arrangement.spacedBy(8.dp),
                    ) {
                        if (calStart != null) {
                            CardAction("Add to calendar", R.drawable.ic_events) {
                                CalendarHelper.add(ctx, e.name, calStart, e.end ?: calStart, e.details)
                            }
                        }
                        if (long) CardAction("Show more", onClick = onMore)
                    }
                }
            }
        }
    }
}

// ───────────────────────── Updates: GitHub releases ─────────────────────────

@Composable
fun UpdatesScreen(vm: MainViewModel) {
    val p = LocalPal.current
    LaunchedEffect(Unit) { if (vm.update is UpdateState.Idle) vm.checkUpdate() }

    Column(Modifier.fillMaxSize().statusBarsPadding()) {
        Header("Updates", "Installed version ${vm.installedVersion}", vm)
        Column(
            Modifier.verticalScroll(rememberScrollState()).padding(horizontal = 20.dp).padding(top = 20.dp, bottom = 130.dp),
            verticalArrangement = Arrangement.spacedBy(14.dp),
        ) {
            SoftCard {
                when (val u = vm.update) {
                    is UpdateState.Idle, is UpdateState.Checking -> {
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            CircularProgressIndicator(Modifier.size(22.dp), color = p.up, strokeWidth = 2.5.dp)
                            Spacer(Modifier.width(14.dp))
                            Text("Checking for updates…", color = p.fg, fontSize = 18.sp, fontWeight = FontWeight.SemiBold)
                        }
                    }
                    is UpdateState.UpToDate -> {
                        StatusTitle("You're up to date", "Momentum ${vm.installedVersion} is the latest version.")
                        Spacer(Modifier.height(18.dp))
                        PrimaryButton("Check again") { vm.checkUpdate() }
                    }
                    is UpdateState.Available -> {
                        StatusTitle("Version ${u.info.version} is available", sizeLabel(u.info.size))
                        ReleaseNotes(u.info.notes)
                        Spacer(Modifier.height(18.dp))
                        PrimaryButton("Download & install") { vm.downloadUpdate() }
                    }
                    is UpdateState.Downloading -> {
                        StatusTitle("Downloading ${u.info.version}…", "${(u.progress * 100).toInt()}%")
                        Spacer(Modifier.height(16.dp))
                        LinearProgressIndicator(
                            progress = { u.progress }, modifier = Modifier.fillMaxWidth().height(6.dp).clip(CircleShape),
                            color = p.up, trackColor = p.sel,
                        )
                    }
                    is UpdateState.Ready -> {
                        StatusTitle("Ready to install", "Version ${u.info.version} has been downloaded.")
                        Spacer(Modifier.height(18.dp))
                        PrimaryButton("Install") { vm.installUpdate() }
                        vm.installHint?.let { Text(it, color = p.mut, fontSize = 14.sp, modifier = Modifier.padding(top = 12.dp)) }
                    }
                    is UpdateState.Error -> {
                        StatusTitle("Couldn't check for updates", u.message)
                        Spacer(Modifier.height(18.dp))
                        PrimaryButton("Try again") { vm.checkUpdate() }
                    }
                }
            }
            Text(
                "Updates come from the Releases page of the Momentum GitHub repository. Installing keeps your data.",
                color = p.mut, fontSize = 13.sp, modifier = Modifier.padding(horizontal = 4.dp),
            )
        }
    }
}

@Composable
private fun StatusTitle(title: String, sub: String) {
    val p = LocalPal.current
    Text(title, color = p.fg, fontSize = 22.sp, lineHeight = 26.sp, fontWeight = FontWeight.Bold, letterSpacing = (-0.4).sp)
    Text(sub, color = p.mut, fontSize = 15.sp, modifier = Modifier.padding(top = 4.dp))
}

@Composable
private fun ReleaseNotes(notes: String) {
    if (notes.isBlank()) return
    val p = LocalPal.current
    Text(
        notes.take(700), color = p.fg, fontSize = 14.sp, lineHeight = 20.sp,
        modifier = Modifier.padding(top = 14.dp).fillMaxWidth().background(p.sel, RoundedCornerShape(14.dp)).padding(14.dp),
    )
}

private fun sizeLabel(bytes: Long) = if (bytes > 0) "%.1f MB".format(bytes / 1_048_576.0) else "New version"

// ───────────────────────── About ─────────────────────────

@SuppressLint("BatteryLife")
@Composable
fun AboutScreen(vm: MainViewModel) {
    val p = LocalPal.current
    val ctx = LocalContext.current
    val pm = ctx.getSystemService(PowerManager::class.java)
    val unrestricted = pm.isIgnoringBatteryOptimizations(ctx.packageName)
    val notifOn = Notifier.canNotify(ctx)

    Column(Modifier.fillMaxSize().statusBarsPadding()) {
        Header("About", "Momentum ${vm.installedVersion}", vm)
        Column(
            Modifier.verticalScroll(rememberScrollState()).padding(horizontal = 20.dp).padding(top = 20.dp, bottom = 130.dp),
            verticalArrangement = Arrangement.spacedBy(14.dp),
        ) {
            SoftCard {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Image(painterResource(R.drawable.ic_launcher), null, Modifier.size(64.dp).clip(RoundedCornerShape(16.dp)))
                    Spacer(Modifier.width(16.dp))
                    Column {
                        Text("Momentum", color = p.fg, fontSize = 22.sp, fontWeight = FontWeight.Bold)
                        Text("Department of CSE · SIMT Engineering College", color = p.mut, fontSize = 14.sp)
                    }
                }
                Text(
                    "Keeps track of everything on the department calendar — exams, assignment deadlines, meetups, hackathons — sorted into Upcoming, Ongoing and Past.",
                    color = p.fg, fontSize = 15.sp, lineHeight = 22.sp, modifier = Modifier.padding(top = 16.dp),
                )
            }

            SoftCard {
                Text("Background & notifications", color = p.fg, fontSize = 18.sp, fontWeight = FontWeight.SemiBold)
                Text(
                    "Momentum checks events.json about every 15 minutes, even when the app is closed, and pops up a notification for every new or changed entry.",
                    color = p.mut, fontSize = 14.sp, lineHeight = 20.sp, modifier = Modifier.padding(top = 6.dp, bottom = 16.dp),
                )
                if (!notifOn) {
                    PrimaryButton("Turn on notifications") { openNotificationSettings(ctx) }
                    Spacer(Modifier.height(10.dp))
                }
                if (!unrestricted) {
                    PrimaryButton("Allow background activity") {
                        ctx.startActivity(
                            Intent(Settings.ACTION_REQUEST_IGNORE_BATTERY_OPTIMIZATIONS, "package:${ctx.packageName}".toUri())
                                .addFlags(Intent.FLAG_ACTIVITY_NEW_TASK),
                        )
                    }
                }
                if (notifOn && unrestricted) {
                    Pill("Notifications and background sync are on", p.on)
                }
            }

            Column(Modifier.padding(horizontal = 4.dp), verticalArrangement = Arrangement.spacedBy(3.dp)) {
                listOf(
                    "Created by: MD. Montasir Rahman Mahie",
                    "Created on: 21st August 2026", "All rights reserved",
                ).forEach { Text(it, color = p.mut, fontSize = 13.5.sp) }
                Text(
                    "Contact: mahie.edu@gmail.com", color = p.up, fontSize = 13.5.sp,
                    modifier = Modifier.clickable {
                        ctx.startActivity(Intent(Intent.ACTION_SENDTO, "mailto:mahie.edu@gmail.com".toUri()).addFlags(Intent.FLAG_ACTIVITY_NEW_TASK))
                    },
                )
            }

            Spacer(Modifier.height(4.dp))
            Text(
                "Terms of Service",
                color = p.up,
                fontSize = 14.sp,
                fontWeight = FontWeight.SemiBold,
                textAlign = TextAlign.Center,
                modifier = Modifier
                    .fillMaxWidth()
                    .clickable {
                        ctx.startActivity(
                            Intent(Intent.ACTION_VIEW, "https://github.com/mahie-cs/Chrono-Events/blob/main/TERMS_OF_SERVICE.md".toUri())
                                .addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
                        )
                    }
                    .padding(vertical = 8.dp),
            )
        }
    }
}

private fun openNotificationSettings(ctx: Context) {
    ctx.startActivity(
        Intent(Settings.ACTION_APP_NOTIFICATION_SETTINGS)
            .putExtra(Settings.EXTRA_APP_PACKAGE, ctx.packageName)
            .addFlags(Intent.FLAG_ACTIVITY_NEW_TASK),
    )
}
