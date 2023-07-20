const sqlite3 = require("sqlite3").verbose();
const redis = require("redis");

const database = new sqlite3.Database("./db/chinook.db", (err) => {
  if (err) {
    return console.log(err.message);
  }
  console.log("Connected to database.");
});

const client = redis.createClient({
  socket: {
    host: "your_redis_server_ip_address",
    port: "your_redis_server_port", // By defualt is 6379
    // username: "", // if you have (not needed by defualt)
    // password: "", // if you have (not needed by defualt)
  },
});
client
  .connect()
  .then(console.log("Connected to redis server."))
  .catch((err) => console.log(err));
client.on("error", (err) => console.log(err));

const query = "select TrackId from playlist_track";

console.time("Query_Time");

client.get(query).then((value) => {
  if (value) {
    client.DEL(query);
    console.log(`Redis Cache : Number of records -> ${value}`);
    console.timeEnd("Query_Time");
  } else {
    database.serialize(() => {
      database.all(query, (err, value) => {
        if (err) {
          return console.log(err);
        } else {
          console.log(`Sqlite Query : Number of records -> ${value.length}`);
          console.timeEnd("Query_Time");
        }
        client.set(query, value.length, (err) => {
          if (err) {
            return console.log(err);
          }
        });
        client.set(query, value.length).catch((err) => console.log(err));
      });
    });
  }
});
