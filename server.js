const path = require("path");
const express = require("express");
const { MongoClient } = require("mongodb");

const PORT = Number(process.env.PORT || 8787);
const MONGODB_URI = process.env.MONGODB_URI || "mongodb+srv://belto_user:1xreNzfGsivHvGDB@cluster0.biyfimo.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0";
const MONGODB_DB  = process.env.MONGODB_DB  || "slyos";

if (!MONGODB_URI) throw new Error("Missing MONGODB_URI");

const app = express();
app.set("trust proxy", true);

// --- Static frontend ---
const pub = path.join(__dirname, "public");
app.use(express.static(pub, { maxAge: 0, etag: false }));

// --- API middlewares ---
app.use("/api", express.json({ limit: "1mb" }));
app.use("/api", (req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(204).end();
  next();
});

// --- Mongo (lazy) ---
let cached = { client: null, db: null };
async function getDb() {
  if (cached.db) return cached.db;
  const client = new MongoClient(MONGODB_URI, { maxPoolSize: 5 });
  await client.connect();
  cached.client = client;
  cached.db = client.db(MONGODB_DB);
  return cached.db;
}

// --- POST /api/waitlist ---
app.post("/api/waitlist", async (req, res) => {
  try {
    const email = String(req.body?.email || "").trim().toLowerCase();
    const audienceRaw = String(req.body?.audience || "company").trim().toLowerCase();
    const audience = audienceRaw === "app" ? "individual" : audienceRaw;
    const org = String(req.body?.org || "").trim();

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
      return res.status(400).json({ ok:false, error:"Invalid email" });
    if (!["company","individual","personal"].includes(audience))
      return res.status(400).json({ ok:false, error:"Invalid audience" });

    const db = await getDb();
    const col = db.collection("waitlist");
    const doc = {
      email, audience, org: org || null,
      ts: new Date(),
      ua: req.headers["user-agent"] || null,
      ip: (req.headers["x-forwarded-for"] || req.socket?.remoteAddress || "").split(",")[0].trim(),
    };
    await col.updateOne({ email }, { $set: doc }, { upsert: true });
    res.json({ ok:true, saved:{ email, audience, org: doc.org } });
  } catch (err) {
    console.error("waitlist error:", err);
    res.status(500).json({ ok:false, error:"Server error" });
  }
});

// --- SPA fallback (serves index.html for unknown routes) ---
app.get("*", (_req, res) => {
  res.sendFile(path.join(pub, "index.html"));
});

app.listen(PORT, "0.0.0.0", () => {
  console.log(`SlyOS running on http://0.0.0.0:${PORT}`);
});
