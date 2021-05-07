import * as mongo from "mongodb";
import PositionFacade from "../src/facades/positionFacade";
import { hash } from "bcryptjs";
import {
  positionCreator,
  getLatitudeInside,
  getLatitudeOutside,
} from "../src/utils/geoUtils";
import { ApiError } from "../src/errors/apierror";
import chai from "chai";

const expect = chai.expect;

const DIST_TO_SEARCH = 500;

//use these two lines for more streamlined tests of promise operations
import chaiAsPromised from "chai-as-promised";
chai.use(chaiAsPromised);
import { InMemoryDbConnector } from "../src/config/dbConnector";
let positionCollection: mongo.Collection;
let friendsCollection: mongo.Collection;
let positionFacade: PositionFacade;

describe("## Verify the Positions Facade ##", () => {
  before(async function () {
    const client = await InMemoryDbConnector.connect();
    const db = client.db();
    positionCollection = db.collection("positions");
    friendsCollection = db.collection("friends");
    positionFacade = new PositionFacade(db);
    await positionCollection.createIndex(
      { lastUpdated: 1 },
      { expireAfterSeconds: 60 }
    );
    await positionCollection.createIndex({ location: "2dsphere" });
  });

  beforeEach(async () => {
    const hashedPW = await hash("secret", 8);
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
      firstName: "Peter",
      lastName: "Admin",
      email: "peter@admin.dk",
      password: hashedPW,
      role: "admin",
    };

    const status = await friendsCollection.insertMany([f1, f2, f3]);

    await positionCollection.deleteMany({});

    const positions = [
      positionCreator(
        12.48,
        55.77,
        f1.email,
        f1.firstName + " " + f1.lastName,
        true
      ),
      positionCreator(
        12.48,
        getLatitudeInside(55.77, DIST_TO_SEARCH),
        f2.email,
        f2.firstName + " " + f2.lastName,
        true
      ),
      positionCreator(
        12.58,
        getLatitudeOutside(55.77, DIST_TO_SEARCH),
        f3.email,
        f3.firstName + " " + f3.lastName,
        true
      ),
    ];
    await positionCollection.insertMany(positions);
  });

  describe("Verify the addOrUpdatePosition method", () => {
    it("It should update pp@b.dk's position document", async () => {
      const result = await positionFacade.addOrUpdatePosition("pp@b.dk", 2, 3);
      expect(result.name).to.be.equal("Peter Pan");
      expect(result.location.coordinates[0]).to.be.equal(2);
    });
  });

  //Whether this test passed depends on whether you have designed it to throw an exception
  describe("Verify the addOrUpdatePosition method", () => {
    it("It should not update XXXX@b.dk's position document", async () => {
      await expect(
        positionFacade.addOrUpdatePosition("XXXX@b.dk", 2, 3)
      ).to.be.rejectedWith(ApiError);
    });
  });

  describe("Verify the findNearbyFriends method", () => {
    it("Should find 1 player named Donald Duck", async () => {
      const result = await positionFacade.findNearbyFriends(
        "pp@b.dk",
        12.48,
        55.77,
        DIST_TO_SEARCH
      );
      expect(result.length).to.be.equal(1);
      expect(result[0].name).to.be.equal("Donald Duck");
    });
  });

  describe("Verify the findNearbyFriends method", () => {
    it("Should Not find xxxxxxxx@b.dk", async () => {
      await expect(
        positionFacade.findNearbyFriends(
          "xxxxxxxx@b.dk",
          12.48,
          55.77,
          DIST_TO_SEARCH
        )
      ).to.be.rejectedWith(ApiError);
    });
  });
});
