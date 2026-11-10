/*
 * Anita's Little Loaf & Co. shared logic.
 * The website, the dashboard and the server all load this same file, so a change
 * gives the same result everywhere. All the shop's data lives in one "state" object:
 * products, pickup settings, orders, catering requests and chats.
 */
(function (root, factory) {
  if (typeof module === "object" && module.exports) module.exports = factory();
  else root.NusaLogic = root.ShopLogic = factory();
})(typeof self !== "undefined" ? self : this, function () {
  "use strict";
  var VERSION = 4;

  /* ---------- dates, always in New Brunswick (Atlantic) time ---------- */
  function iso(d) { return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0"); }
  function parse(s) { var p = String(s).split("-"); return new Date(+p[0], +p[1] - 1, +p[2], 12); }
  function addDays(s, n) { var d = parse(s); d.setDate(d.getDate() + n); return iso(d); }
  function today() {
    try {
      var p = new Intl.DateTimeFormat("en-CA", { timeZone: "America/Moncton", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date());
      if (/^\d{4}-\d{2}-\d{2}$/.test(p)) return p;
    } catch (e) {}
    return iso(new Date());
  }
  function monday(off, base) { var d = parse(base || today()); d.setDate(d.getDate() - ((d.getDay() + 6) % 7) + 7 * (off || 0)); return iso(d); }
  function longDate(s) { return parse(s).toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" }); }
  function money(n) { n = Math.round(n * 100) / 100; return "$" + (n % 1 ? n.toFixed(2) : n.toLocaleString("en-US")); }
  function uid() { return Date.now().toString(36) + Math.random().toString(36).slice(2, 8); }
  function token() { var s = ""; for (var i = 0; i < 3; i++) s += Math.random().toString(36).slice(2, 10); return s.slice(0, 24); }
  function clean(v, n) { return typeof v === "string" ? v.trim().slice(0, n) : ""; }
  function copy(x) { return JSON.parse(JSON.stringify(x)); }

  /* ---------- the way Anita's sells: a Thursday bread drop, plus the market in season ---------- */
  function basePoints() {
    return {
      stgeorge: { name: "St. George bread drop", place: "Magaguadavic Place, St. George", hours: "4:30 to 5:00 pm", days: [4], slots: ["4:30 to 5:00 pm"], cap: 40, on: true, done: "Picked up" },
      standrews: { name: "St. Andrews bread drop", place: "The Wharf, St. Andrews", hours: "5:30 to 6:00 pm", days: [4], slots: ["5:30 to 6:00 pm"], cap: 40, on: true, done: "Picked up" },
      market: { name: "St. Andrews Farmers' Market", place: "Water Street, booth 21, St. Andrews", hours: "8:30 am to 1 pm", days: [4], slots: ["8:30 to 10 am", "10 to 11:30 am", "11:30 am to 1 pm"], cap: 50, on: false, done: "Picked up" }
    };
  }
  var PORDER = ["stgeorge", "standrews", "market"];
  // Every flavour is its own "size", so the customer picks one and the owner can switch one off when it runs out.
  function P(id, name, cat, flavours, price, on) { return { id: id, name: name, cat: cat, img: id, sizes: flavours.map(function (f, i) { return { id: id + "-" + i, label: f, price: price, on: on !== false }; }) }; }
  function baseProducts() {
    return [
      P("sourdough", "Sourdough loaf", "bread", ["Country loaf", "Cranberry gouda", "Italian herb and cheese", "Multigrain seeded", "Whole wheat", "Jalapeño cheddar"], 10),
      P("sandwich", "Soft sourdough sandwich loaf", "bread", ["Regular"], 10),
      P("rolls", "Sourdough rolls, pack of 6", "bread", ["Regular"], 6),
      P("focaccia", "Sourdough focaccia", "focaccia", ["Pesto and Parmesan", "Garlic herb and cheese", "Rosemary and sea salt", "Rosemary and olive", "Dill pickle", "Capers, red onion and tomato", "Caramelized onion and potato"], 10),
      P("cinnamon", "Cinnamon roll", "sweet", ["Apple pie", "Blueberry citrus", "Iced", "Plain"], 5),
      P("pretzel", "Sourdough pretzel", "sweet", ["Cinnamon sugar", "Salted"], 5)
    ];
  }
  /* Orders for a Thursday drop close at the end of the Monday before it. */
  function cutoff(date) { var d = parse(date); d.setDate(d.getDate() - ((d.getDay() + 6) % 7)); return iso(d); }
  function sizeIndex(products) { var m = {}; (products || []).forEach(function (p) { p.sizes.forEach(function (z) { m[z.id] = { p: p, z: z }; }); }); return m; }
  function live(o) { return o.status !== "cancelled" && !o.declined; }
  function oTotal(o, ix) { return o.items.reduce(function (a, i) { var m = ix[i.s]; return a + (m ? m.z.price : i.price || 0) * i.q; }, 0); }
  function firstName(n) { return String(n || "").trim().split(" ")[0] || "there"; }
  function slotDay(o) { return longDate(o.date) + (o.slot ? ", " + o.slot : ""); }

  /* ---------- sample data ---------- */
  function rng(a) { return function () { a |= 0; a = a + 0x6D2B79F5 | 0; var t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
  var PEOPLE = [["Heather MacLeod", "506-555-0142"], ["Dan Gallant", "506-555-0188"], ["Megan Doucet", "506-555-0120"], ["Tom Brewer", "506-555-0199"], ["Karen Leblanc", "506-555-0176"], ["Rosie Cormier", "506-555-0133"], ["Chris Mersereau", "506-555-0111"], ["Grace Hatt", "506-555-0154"], ["Ben Stuart", "506-555-0163"], ["Laura Matthews", "506-555-0102"], ["Sam Thibodeau", "506-555-0117"], ["Nadine Robichaud", "506-555-0145"], ["Owen McKay", "506-555-0128"], ["Lily Ferguson", "506-555-0191"], ["Marc Arsenault", "506-555-0182"], ["Holly Tucker", "506-555-0137"], ["Jess Murray", "506-555-0156"], ["Eli Craig", "506-555-0109"], ["Maureen Frye", "506-555-0170"], ["Ryan Lord", "506-555-0124"], ["Claire Boudreau", "506-555-0193"], ["Kyle Lambert", "506-555-0115"], ["Sophie Paquet", "506-555-0138"], ["Noah Hanson", "506-555-0166"], ["Dawn Hooper", "506-555-0147"], ["Leah Mitchell", "506-555-0159"]];
  var NOTES = ["My daughter will pick up", "Could you slice the country loaf?", "Running a few minutes late", "Extra icing if you can", "It's a gift, could it go in its own bag?", "Paying by e-transfer", "Two separate bags please"];
  function seed() {
    var T = today(), r = rng(1801), ord = [], id = 1001, prods = baseProducts(), pts = basePoints(), threads = {};
    function pickP() { var w = r() < .6 ? Math.floor(r() * 8) : Math.floor(r() * PEOPLE.length); return PEOPLE[w]; }
    function items() { var n = 1 + Math.floor(r() * 3), out = [], used = {}; for (var k = 0; k < n; k++) { var p = prods[Math.floor(r() * prods.length)]; if (used[p.id]) continue; used[p.id] = 1; var z = p.sizes[Math.floor(r() * p.sizes.length)]; out.push({ s: z.id, q: 1 + (r() < .3 ? 1 : 0) }); } return out.length ? out : [{ s: "sourdough-0", q: 1 }]; }
    function make(date, pt) {
      var c = pickP(), on = r() < .75, past = date < T;
      var st = past ? (r() < .04 ? "cancelled" : "done") : (date === T ? (r() < .5 ? "packed" : "new") : (r() < .18 ? "packed" : "new"));
      var P0 = pts[pt];
      ord.push({ id: id++, date: date, point: pt, loc: "", slot: P0.slots[Math.floor(r() * P0.slots.length)], name: c[0], phone: c[1], items: items(), note: r() < .16 ? NOTES[Math.floor(r() * NOTES.length)] : "", source: on ? "online" : "by hand", paid: past || r() < .25, status: st, placed: Date.now() - (1 + Math.floor(r() * 6)) * 864e5 });
    }
    // A light demo: three past weeks for History, three orders a stop this week, one a stop next week.
    for (var w = -3; w <= 1; w++) {
      var thu = addDays(monday(w, T), 3), i, g = w === 1 ? 1 : 3;
      for (i = 0; i < g; i++) make(thu, "stgeorge"); for (i = 0; i < g; i++) make(thu, "standrews");
    }
    // Two fresh online orders waiting for a yes, each with its chat.
    var nextThu = addDays(monday(0, T), 3); if (cutoff(nextThu) < T) nextThu = addDays(nextThu, 7);
    var now = Date.now();
    [["Jenna Caldwell", "506-555-0181", [{ s: "sourdough-1", q: 1 }, { s: "cinnamon-1", q: 4 }], "Is the cranberry gouda okay to freeze? Buying two weeks' worth."],
     ["Mike Stewart", "506-555-0172", [{ s: "focaccia-2", q: 1 }, { s: "rolls-0", q: 2 }], ""]].forEach(function (x, n) {
      var pk = n ? "stgeorge" : "standrews", t = token(), o = { id: id++, token: t, date: nextThu, point: pk, loc: "", slot: pts[pk].slots[0], name: x[0], phone: x[1], email: "", items: x[2], note: "", source: "online", paid: false, status: "new", pending: true, placed: now - (n + 1) * 36e5 };
      ord.push(o);
      var msgs = [{ id: uid(), from: "shop", text: "Thank you, " + firstName(o.name) + "! We have your order and will confirm it shortly. Message us here if you need anything.", at: o.placed }];
      if (!x[3]) return;
      msgs.push({ id: uid(), from: "customer", text: x[3], at: o.placed + 6e4 });
      threads["o-" + o.id] = { id: "o-" + o.id, token: t, name: o.name, phone: o.phone, orderId: o.id, msgs: msgs, staffSeen: 1, custSeen: msgs.length, at: msgs[msgs.length - 1].at };
    });
    var cat = [
      { event: "Staff lunch", org: "Charlotte County Dental", contact: "Sarah Hanley", phone: "506-555-0123", email: "sarah@ccdental.example", date: addDays(T, 5), time: "12:00 pm", guests: 18, mode: "Delivery", address: "Milltown Blvd, St. Stephen", diet: "2 vegetarian", menu: "Broccoli cheddar soup, Italian sandwiches on focaccia, cinnamon rolls", quote: 390, notes: "Soup in carafes. They have a microwave.", status: "confirmed", got: -9 },
      { event: "Baby shower", org: "Hatt family", contact: "Emily Hatt", phone: "506-555-0101", email: "emily.h@example.com", date: addDays(T, 12), time: "2:00 pm", guests: 25, mode: "Pickup", address: "", diet: "1 nut allergy", menu: "Focaccia board, mini sandwiches, the doughnut tower", quote: 0, notes: "Pastel icing on the doughnuts if possible.", status: "new", got: 0 },
      { event: "Birthday dinner", org: "Leblanc family", contact: "Karen Leblanc", phone: "506-555-0176", email: "karen@example.com", date: addDays(T, -12), time: "6:30 pm", guests: 30, mode: "Delivery", address: "St. George, NB", diet: "None", menu: "Chicken parm with Alfredo or marinara, crème brûlée", quote: 720, notes: "", status: "done", got: -30 }
    ].map(function (c, i) { c.id = i + 1; c.got = now + c.got * 864e5; return c; });
    return { v: VERSION, products: prods, points: pts, closed: {}, orders: ord, catering: cat, threads: threads, nid: id, cid: 100 };
  }

  /* ---------- notes from the bakery that the customer sees ---------- */
  function shopNote(s, orderId, text, at) {
    var th = threadForOrder(s, orderId); if (!th) return s;
    at = at || Date.now();
    var t = Object.assign({}, th, { msgs: th.msgs.concat([{ id: uid(), from: "shop", text: text, at: at }]), at: at });
    t.staffSeen = t.msgs.length;
    var threads = Object.assign({}, s.threads); threads[t.id] = t;
    return Object.assign({}, s, { threads: threads });
  }
  function threadForOrder(s, orderId) { var all = s.threads || {}; for (var k in all) if (all[k].orderId === orderId) return all[k]; return null; }
  function threadForCatering(s, cid) { var all = s.threads || {}; for (var k in all) if (all[k].cateringId === cid) return all[k]; return null; }
  function orderOf(s, id) { return s.orders.filter(function (o) { return o.id == id; })[0]; }
  function replaceOrder(s, o) { return Object.assign({}, s, { orders: s.orders.map(function (x) { return x.id === o.id ? o : x; }) }); }

  /* how full a pickup day is */
  function load(s, date, point, skipId) { return s.orders.filter(function (o) { return o.date === date && o.point === point && live(o) && o.id !== skipId; }).length; }
  function dayOpen(s, date, point) {
    var P = s.points[point]; if (!P || !P.on) return "That pickup option is paused right now.";
    if (P.days.indexOf(parse(date).getDay()) < 0) return "That day isn't a pickup day.";
    if (date <= today() || today() > cutoff(date)) return "Orders for that drop closed on Monday. Please pick the next one.";
    if (s.closed[date + "|" + point]) return "Sorry, that day just closed for online orders. Please pick another day.";
    if (load(s, date, point) >= (P.cap || 999)) return "Sorry, that day just filled up. Please pick another day.";
    return "";
  }

  /* ---------- the dashboard's changes ---------- */
  function applyOp(s, op, now) {
    now = now || Date.now();
    var o, next, out, th;
    switch (op.t) {
      case "reset": return { state: seed() };
      case "add": {
        var ord = copy(op.order); ord.how = ord.how === "delivery" ? "delivery" : "pickup"; ord.loc = clean(ord.loc, 120); ord.id = s.nid; ord.placed = now; ord.source = "by hand"; ord.status = "new";
        return { state: Object.assign({}, s, { orders: s.orders.concat([ord]), nid: s.nid + 1 }), id: ord.id };
      }
      case "update": {
        o = orderOf(s, op.order.id); if (!o) return { error: "That order was deleted on another device." };
        next = Object.assign({}, o, { date: op.order.date, point: op.order.point, slot: op.order.slot || o.slot, name: clean(op.order.name, 80), phone: clean(op.order.phone, 30), items: op.order.items, note: clean(op.order.note, 300), paid: !!op.order.paid, how: op.order.how === "delivery" ? "delivery" : "pickup", loc: clean(op.order.loc, 120) });
        return { state: replaceOrder(s, next) };
      }
      case "delete": return { state: Object.assign({}, s, { orders: s.orders.filter(function (x) { return x.id !== op.id; }) }) };
      case "paid": o = orderOf(s, op.id); if (!o) return { error: "That order is no longer here." }; return { state: replaceOrder(s, Object.assign({}, o, { paid: true })) };
      case "status": {
        o = orderOf(s, op.id); if (!o) return { error: "That order is no longer here." };
        if (o.status === "cancelled" && o.by === "customer" && op.s !== "new") return { error: "The customer cancelled this order." };
        var P = s.points[o.point] || {}, note = "";
        next = Object.assign({}, o);
        if (op.s === "confirm") { next.pending = false; delete next.declined; note = "Your order is confirmed. See you " + slotDay(o) + " at " + (P.place || "the pickup spot") + ".";}
        else if (op.s === "decline") { next.pending = false; next.declined = clean(op.reason, 300) || "We can't take this order."; note = "Sorry, we can't take this order. " + next.declined; }
        else if (op.s === "packed") { next.pending = false; next.status = "packed"; note = "Your order is bagged and ready for you, " + slotDay(o) + ".";}
        else if (op.s === "done") { next.pending = false; next.status = "done"; note = "Picked up. Enjoy, and thank you for ordering from Anita's!";}
        else if (op.s === "new") { next.status = "new"; delete next.by; }
        else if (op.s === "cancelled") { next.status = "cancelled"; next.by = "nusa"; note = "We cancelled this order. Message us here if you have any questions."; }
        out = replaceOrder(s, next);
        if (note && o.source === "online") out = shopNote(out, o.id, note, now);
        return { state: out };
      }
      case "products": return { state: Object.assign({}, s, { products: op.products }) };
      case "points": {
        var pts = {};
        for (var k in s.points) {
          var a = s.points[k], b = op.points[k] || a;
          var slots = (b.slots || []).map(function (x) { return clean(x, 40); }).filter(Boolean).slice(0, 8);
          pts[k] = Object.assign({}, a, { on: !!b.on, days: (b.days || []).filter(function (d) { return d >= 0 && d <= 6; }), slots: slots.length ? slots : a.slots, cap: Math.max(1, Math.min(999, +b.cap || a.cap)), place: clean(b.place, 120) || a.place, hours: clean(b.hours, 60) || a.hours });
        }
        return { state: Object.assign({}, s, { points: pts }) };
      }
      case "closed": {
        var c = Object.assign({}, s.closed), key = op.date + "|" + op.point;
        if (op.v) c[key] = true; else delete c[key];
        return { state: Object.assign({}, s, { closed: c }) };
      }
      case "reply": {
        th = s.threads[op.thread]; var text = clean(op.text, 1000);
        if (!th) return { error: "That conversation is gone." };
        if (!text) return { error: "Write a message first." };
        var t = Object.assign({}, th, { msgs: th.msgs.concat([{ id: uid(), from: "shop", text: text, at: now }]), at: now }); t.staffSeen = t.msgs.length;
        var ts = Object.assign({}, s.threads); ts[t.id] = t; return { state: Object.assign({}, s, { threads: ts }) };
      }
      case "seen": {
        th = s.threads[op.thread]; if (!th || th.staffSeen === th.msgs.length) return { state: s };
        var ts2 = Object.assign({}, s.threads); ts2[th.id] = Object.assign({}, th, { staffSeen: th.msgs.length }); return { state: Object.assign({}, s, { threads: ts2 }) };
      }
      case "csave": {
        var c0 = copy(op.c), list = s.catering.slice(), prev = null, cid = s.cid;
        if (c0.id) { var ix = list.findIndex(function (x) { return x.id === c0.id; }); if (ix < 0) return { error: "That request was deleted on another device." }; prev = list[ix]; c0.got = prev.got; list[ix] = c0; }
        else { c0.id = s.cid; c0.got = now; list.push(c0); cid = s.cid + 1; }
        out = Object.assign({}, s, { catering: list, cid: cid });
        var cth = threadForCatering(out, c0.id);
        if (cth && prev && prev.status !== c0.status) {
          var msg = c0.status === "quoted" ? "Here is your quote for " + c0.guests + " guests on " + longDate(c0.date) + ": " + money(+c0.quote) + ". Reply here to confirm or ask for changes."
            : c0.status === "confirmed" ? "Your catering is confirmed for " + longDate(c0.date) + " at " + c0.time + ". Thank you!" : "";
          if (msg) { var t2 = Object.assign({}, cth, { msgs: cth.msgs.concat([{ id: uid(), from: "shop", text: msg, at: now }]), at: now }); t2.staffSeen = t2.msgs.length; var ts3 = Object.assign({}, out.threads); ts3[t2.id] = t2; out = Object.assign({}, out, { threads: ts3 }); }
        }
        return { state: out, id: c0.id };
      }
      case "cdel": return { state: Object.assign({}, s, { catering: s.catering.filter(function (x) { return x.id !== op.id; }) }) };
    }
    return { error: "Could not read that change." };
  }
  function isOp(x) {
    if (!x || typeof x !== "object") return false;
    var isOrder = function (v) { return !!v && typeof v === "object" && typeof v.date === "string" && Array.isArray(v.items) && v.items.length <= 50; };
    switch (x.t) {
      case "reset": return true;
      case "add": return isOrder(x.order);
      case "update": return isOrder(x.order) && typeof x.order.id === "number";
      case "delete": case "paid": return typeof x.id === "number";
      case "status": return typeof x.id === "number" && ["confirm", "decline", "packed", "done", "new", "cancelled"].indexOf(x.s) > -1;
      case "products": return Array.isArray(x.products) && x.products.length <= 80;
      case "points": return !!x.points && typeof x.points === "object";
      case "closed": return typeof x.date === "string" && typeof x.point === "string" && typeof x.v === "boolean";
      case "reply": return typeof x.thread === "string" && typeof x.text === "string";
      case "seen": return typeof x.thread === "string";
      case "csave": return !!x.c && typeof x.c === "object";
      case "cdel": return typeof x.id === "number";
    }
    return false;
  }

  /* ---------- the customer's side ---------- */
  function publicView(s) {
    var ld = {};
    s.orders.forEach(function (o) { if (live(o) && o.date >= today()) { var k = o.date + "|" + o.point; ld[k] = (ld[k] || 0) + 1; } });
    var products = s.products.map(function (p) { return { id: p.id, name: p.name, cat: p.cat, img: p.img, photo: p.photo, sizes: p.sizes }; });
    return { products: products, points: s.points, closed: s.closed, load: ld, today: today() };
  }
  function mineView(s, keys) {
    var ok = function (id, tk, list) { return !!tk && list.some(function (k) { return k.id == id && k.token === tk; }); };
    var orders = s.orders.filter(function (o) { return o.token && ok(o.id, o.token, keys.orders || []); });
    var ids = orders.map(function (o) { return o.id; });
    var threads = Object.keys(s.threads || {}).map(function (k) { return s.threads[k]; }).filter(function (t) { return ok(t.id, t.token, keys.threads || []) || (t.orderId && ids.indexOf(t.orderId) > -1); });
    return { orders: orders, threads: threads, points: s.points };
  }
  function applyCustomer(s, op, now) {
    now = now || Date.now();
    var th, threads, msgs;
    switch (op.t) {
      case "place": {
        var o = op.order || {}, tk = op.token;
        if (!tk || tk.length < 16) return { error: "Please refresh the page and try again." };
        var name = clean(o.name, 80), phone = clean(o.phone, 30);
        if (!name) return { error: "Add your name." };
        if (phone.replace(/\D/g, "").length < 7) return { error: "Add a phone number so we can reach you." };
        if (!s.points[o.point]) return { error: "Pick how you'd like to get your order." };
        var shut = dayOpen(s, String(o.date), o.point); if (shut) return { error: shut };
        var ix = sizeIndex(s.products), items = [];
        (o.items || []).slice(0, 30).forEach(function (i) { var q = Math.max(1, Math.min(50, +i.q || 1)); if (ix[i.s]) items.push({ s: i.s, q: q }); });
        if (!items.length) return { error: "Your cart is empty." };
        var off = items.filter(function (i) { return !ix[i.s].z.on; })[0];
        if (off) return { error: ix[off.s].p.name + " just sold out. Please remove it and try again." };
        var ord = { id: s.nid, token: tk, date: String(o.date), point: o.point, loc: clean(o.loc, 80), slot: clean(o.slot, 40), name: name, phone: phone, email: clean(o.email, 80), items: items, note: clean(o.note, 300), source: "online", paid: false, status: "new", pending: true, placed: now };
        var t = { id: "o-" + ord.id, token: tk, name: name, phone: phone, orderId: ord.id, at: now, staffSeen: 1, custSeen: 1, msgs: [{ id: uid(), from: "shop", text: "Thank you, " + firstName(name) + "! We have your order and will confirm it shortly. Message us here if you need anything.", at: now }] };
        if (ord.note) { t.msgs.push({ id: uid(), from: "customer", text: ord.note, at: now }); t.custSeen = 2; }
        threads = Object.assign({}, s.threads); threads[t.id] = t;
        return { state: Object.assign({}, s, { orders: s.orders.concat([ord]), nid: s.nid + 1, threads: threads }), id: ord.id };
      }
      case "cater": {
        var r = op.req || {}, tk2 = op.token;
        if (!tk2 || tk2.length < 16) return { error: "Please refresh the page and try again." };
        var cname = clean(r.contact, 80), cphone = clean(r.phone, 30), cemail = clean(r.email, 80);
        if (!cname) return { error: "Add your name." };
        if (!cemail && cphone.replace(/\D/g, "").length < 7) return { error: "Add an email or phone so we can send your quote." };
        if (s.catering.length > 500) return { error: "Requests are paused right now. Please email us." };
        var c = { id: s.cid, event: clean(r.event, 80) || "Event", org: clean(r.org, 80) || cname, contact: cname, phone: cphone, email: cemail, date: clean(r.date, 10), time: clean(r.time, 20) || "12:00 pm", guests: Math.max(1, Math.min(2000, +r.guests || 10)), mode: r.mode === "Pickup" ? "Pickup" : "Delivery", address: clean(r.address, 160), diet: clean(r.diet, 120) || "None", menu: clean(r.menu, 400), quote: 0, estimate: +r.estimate || 0, notes: clean(r.notes, 400), status: "new", got: now, source: "online" };
        var ct = { id: "k-" + c.id, token: tk2, name: cname, phone: cphone, cateringId: c.id, at: now, staffSeen: 1, custSeen: 1, msgs: [{ id: uid(), from: "shop", text: "Thank you, " + firstName(cname) + "! We have your catering request for " + c.guests + " guests and will send a quote within a day. Ask us anything here.", at: now }] };
        threads = Object.assign({}, s.threads); threads[ct.id] = ct;
        return { state: Object.assign({}, s, { catering: s.catering.concat([c]), cid: s.cid + 1, threads: threads }), id: c.id, thread: ct.id };
      }
      case "say": {
        var text = clean(op.text, 1000); if (!text) return { error: "Write a message first." };
        threads = Object.assign({}, s.threads); th = threads[op.thread];
        if (th && th.token !== op.token) return { error: "That conversation could not be found." };
        if (!th) {
          if (!op.token || op.token.length < 16 || !/^c-[a-z0-9]{6,30}$/.test(op.thread)) return { error: "Please refresh the page and try again." };
          if (Object.keys(threads).length > 3000) return { error: "Messages are paused right now. Please email us." };
          th = { id: op.thread, token: op.token, name: clean(op.name, 80) || "Website visitor", msgs: [], staffSeen: 0, custSeen: 0, at: now };
        }
        if (th.msgs.length >= 300) return { error: "This conversation is full. Please email us." };
        if (op.name && th.name === "Website visitor") th = Object.assign({}, th, { name: clean(op.name, 80) });
        msgs = th.msgs.concat([{ id: uid(), from: "customer", text: text, at: now }]);
        threads[th.id] = Object.assign({}, th, { msgs: msgs, custSeen: msgs.length, at: now });
        return { state: Object.assign({}, s, { threads: threads }) };
      }
      case "cancel": {
        var x = orderOf(s, op.id);
        if (!x || !x.token || x.token !== op.token) return { error: "That order could not be found." };
        if (x.status === "cancelled") return { state: s };
        if (x.status === "done") return { error: "This order was already picked up." };
        if (x.status === "packed") return { error: "Your order is already packed. Please message us instead." };
        var out = replaceOrder(s, Object.assign({}, x, { status: "cancelled", by: "customer", pending: false }));
        th = threadForOrder(out, x.id);
        if (th) { msgs = th.msgs.concat([{ id: uid(), from: "customer", text: "I cancelled this order.", at: now }]); var ts = Object.assign({}, out.threads); ts[th.id] = Object.assign({}, th, { msgs: msgs, custSeen: msgs.length, at: now }); out = Object.assign({}, out, { threads: ts }); }
        return { state: out };
      }
      case "read": {
        th = (s.threads || {})[op.thread];
        if (!th || th.token !== op.token || th.custSeen === th.msgs.length) return { state: s };
        threads = Object.assign({}, s.threads); threads[th.id] = Object.assign({}, th, { custSeen: th.msgs.length });
        return { state: Object.assign({}, s, { threads: threads }) };
      }
    }
    return { error: "Could not read that." };
  }
  function isCOp(x) {
    if (!x || typeof x !== "object") return false;
    switch (x.t) {
      case "place": return !!x.order && typeof x.order === "object" && Array.isArray(x.order.items) && typeof x.token === "string";
      case "cater": return !!x.req && typeof x.req === "object" && typeof x.token === "string";
      case "say": return typeof x.thread === "string" && typeof x.token === "string" && typeof x.text === "string";
      case "cancel": return typeof x.id === "number" && typeof x.token === "string";
      case "read": return typeof x.thread === "string" && typeof x.token === "string";
    }
    return false;
  }

  /* what the customer sees on their order page */
  function customerStage(o) {
    if (o.declined) return { k: "declined", t: "We couldn't take this order", step: -1 };
    if (o.status === "cancelled") return { k: "cancelled", t: o.by === "customer" ? "You cancelled this order" : "This order was cancelled", step: -1 };
    if (o.status === "done") return { k: "done", t: "Picked up", step: 3 };
    if (o.status === "packed") return { k: "packed", t: "Bagged and ready for you", step: 2 };
    if (o.pending) return { k: "pending", t: "Sent. Waiting for Anita to confirm", step: 0 };
    return { k: "confirmed", t: "Confirmed", step: 1 };
  }

  return { VERSION: VERSION, iso: iso, parse: parse, addDays: addDays, today: today, monday: monday, longDate: longDate, money: money, uid: uid, token: token, copy: copy,
    basePoints: basePoints, PORDER: PORDER, cutoff: cutoff, baseProducts: baseProducts, sizeIndex: sizeIndex, live: live, oTotal: oTotal, seed: seed, dayOpen: dayOpen, load: load,
    applyOp: applyOp, isOp: isOp, publicView: publicView, mineView: mineView, applyCustomer: applyCustomer, isCOp: isCOp, customerStage: customerStage, threadForOrder: threadForOrder, threadForCatering: threadForCatering };
});
