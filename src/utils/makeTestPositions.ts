import path from "path";
require("dotenv").config({ path: path.join(__dirname, "..", "..", ".env") });
import { DbConnector } from "../config/dbConnector";
const debug = require("debug")("setup-friend-testdata");
import { hash } from "bcryptjs";
import { positionCreator } from "./geoUtils";

async function makeTestPositions() {
  const client = await DbConnector.connect();
  const db = client.db(process.env.DB_NAME);

  const friendsCollection = db.collection("friends");
  const hashedPW = await hash("secret", 8);
  friendsCollection.createIndex({email: 1}, { unique: true });

  await friendsCollection.deleteMany({});

  const f1 = {
    firstName: "Peter",
    lastName: "Pan",
    email: "pp@b.dk",
    password: hashedPW,
    role: "user",
  };
  const f2 = {
    firstName: "Donald",
    lastName: "Duck",
    email: "dd@b.dk",
    password: hashedPW,
    role: "user",
  };
  const f3 = {
    firstName: "Kalle",
    lastName: "Admin",
    email: "peter@admin.dk",
    password: hashedPW,
    role: "admin",
  };

  const status = await friendsCollection.insertMany([f1, f2, f3]);
  debug(`Inserted ${status.insertedCount} test users`);

  /// INSERT CODE_BLOCK-1
  const positionCollection = db.collection("positions");
  await positionCollection.deleteMany({});
  await positionCollection.createIndex(
    { lastUpdated: 1 },
    { expireAfterSeconds: 30 }
  );

  await positionCollection.createIndex({ location: "2dsphere" });

  const positions = [
    positionCreator(
      12.49,
      55.77,
      f1.email,
      f1.firstName + " " + f1.lastName,
      true
    ),
    positionCreator(
      12.50,
      55.77,
      f2.email,
      f2.firstName + " " + f2.lastName,
      true
    ),
    positionCreator(
      12.51,
      55.77,
      f3.email,
      f3.firstName + " " + f3.lastName,
      true
    ),
    positionCreator(12.48, 55.77, "a@aaa.dk", "James Bond", false),
  ];
  const status2 = await positionCollection.insertMany(positions);
  debug(`Inserted ${status2.insertedCount} test Positions`);

  debug(`##################################################`);
  debug(`NEVER, EVER EVER run this on a production database`);
  debug(`##################################################`);
  DbConnector.close();
}

makeTestPositions();
