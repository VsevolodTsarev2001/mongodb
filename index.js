const express = require("express");
const { MongoClient, ObjectId } = require("mongodb");
const path = require("path");

const app = express();
const PORT = 3000;

const client = new MongoClient("mongodb+srv://sevatsarev_db_user:2tEZmCP7IyoxwogJ@cluster0.r9jnpvc.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0");

app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

let users;

(async () => {
    try {
        await client.connect();
        console.log("Connected to MongoDB");
        const db = client.db("Mongodb");
        users = db.collection("users");

        app.get("/", (_, res) => res.sendFile(path.join(__dirname, "public", "index.html")));

        app.get("/api/users", async (_, res) => {
            const data = await users.find().sort({ _id: -1 }).toArray();
            res.json(data);
        });

        app.post("/api/users", async (req, res) => {
            const { name, age, email } = req.body || {};
            if (!name) return res.status(400).json({ error: "name is required" });
            const doc = { name, age: age ? Number(age) : null, email: email || "" };
            const result = await users.insertOne(doc);
            res.status(201).json({ _id: result.insertedId, ...doc });
        });

        app.put("/api/users/:id", async (req, res) => {
            const { id } = req.params;
            if (!ObjectId.isValid(id)) {
                return res.status(400).json({ error: "Invalid user ID" });
            }
            const { name, age, email } = req.body || {};
            const upd = {};
            if (name !== undefined) upd.name = name;
            if (age !== undefined) upd.age = Number(age);
            if (email !== undefined) upd.email = email;

            const result = await users.updateOne({ _id: new ObjectId(id) }, { $set: upd });
            if (result.matchedCount === 0) return res.status(404).json({ error: "User not found" });

            const after = await users.findOne({ _id: new ObjectId(id) });
            res.json(after);
        });

        app.delete("/api/users/:id", async (req, res) => {
            const { id } = req.params;
            if (!ObjectId.isValid(id)) {
                return res.status(400).json({ error: "Invalid user ID" });
            }
            const result = await users.deleteOne({ _id: new ObjectId(id) });
            if (result.deletedCount === 0) return res.status(404).json({ error: "User not found" });
            res.json({ ok: true });
        });

        app.listen(PORT, () => console.log(`Server running at http://localhost:${PORT}`));
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
})();
