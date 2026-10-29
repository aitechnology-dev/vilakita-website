/* Senarai malam yang sudah ditempah, dibaca dari kalender iCal (Google Calendar, Airbnb, Booking.com).
   Tetapkan ICAL_URLS di Vercel → Settings → Environment Variables. Beberapa link dipisahkan dengan koma.
   Respons: { booked: ["2026-11-07", ...], calendars, read, events } — setiap tarikh bermaksud malam tersebut tidak kosong.
   calendars/read/events: bilangan link ditetapkan, link berjaya dibaca dan acara dijumpa (untuk semakan). */
const MYT = 8 * 36e5;                       // Malaysia UTC+8
const DAYS_AHEAD = 400;

const addDays = (s, n) => new Date(Date.parse(s + "T00:00Z") + n * 864e5).toISOString().slice(0, 10);

// "DTSTART;VALUE=DATE:20261107", "DTSTART:20261107T070000Z" atau "DTSTART;TZID=Asia/Kuala_Lumpur:20261107T150000"
const toDate = line => {
  const v = line.slice(line.lastIndexOf(":") + 1).trim();
  if (v.endsWith("Z")) {
    const t = Date.UTC(+v.slice(0, 4), +v.slice(4, 6) - 1, +v.slice(6, 8), +v.slice(9, 11), +v.slice(11, 13));
    return new Date(t + MYT).toISOString().slice(0, 10);
  }
  return v.slice(0, 4) + "-" + v.slice(4, 6) + "-" + v.slice(6, 8);
};

const parse = (ics, booked, from, to) => {
  let ev = null, n = 0;
  for (const l of ics.replace(/\r?\n[ \t]/g, "").split(/\r?\n/)) {
    if (l === "BEGIN:VEVENT") ev = {};
    else if (l === "END:VEVENT") {
      if (ev.s && ev.status !== "CANCELLED") {
        n++;
        const end = ev.e > ev.s ? ev.e : addDays(ev.s, 1);   // DTEND ialah hari check-out, malam itu kosong
        for (let d = ev.s < from ? from : ev.s; d < end && d < to; d = addDays(d, 1)) booked.add(d);
      }
      ev = null;
    }
    else if (!ev) continue;
    else if (/^DTSTART[;:]/.test(l)) ev.s = toDate(l);
    else if (/^DTEND[;:]/.test(l)) ev.e = toDate(l);
    else if (l.startsWith("STATUS:")) ev.status = l.slice(7).trim();
  }
  return n;
};

module.exports = async (req, res) => {
  const urls = (process.env.ICAL_URLS || "").split(/[\s,]+/).filter(Boolean);
  const from = new Date(Date.now() + MYT).toISOString().slice(0, 10), to = addDays(from, DAYS_AHEAD);
  const booked = new Set();
  let ok = 0, events = 0;
  await Promise.all(urls.map(async (u, i) => {
    try {
      const r = await fetch(u.replace(/^webcal:/i, "https:"), { signal: AbortSignal.timeout(8000) });
      if (!r.ok) throw new Error("HTTP " + r.status);
      events += parse(await r.text(), booked, from, to);
      ok++;
    } catch (e) { console.error("iCal #" + (i + 1) + " gagal:", e.message); }
  }));
  if (urls.length && !ok) return res.status(502).json({ error: "Kalender tidak dapat dibaca" });
  res.setHeader("Cache-Control", ok < urls.length ? "s-maxage=60" : "s-maxage=300, stale-while-revalidate=3600");
  res.status(200).json({ booked: [...booked].sort(), calendars: urls.length, read: ok, events });
};
