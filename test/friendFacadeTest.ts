import * as mongo from "mongodb";
import FriendFacade from "../src/facades/friendFacade";

import chai from "chai";
const expect = chai.expect;

//for more streamlined tests of promise operations
import chaiAsPromised from "chai-as-promised";
chai.use(chaiAsPromised);

import bcryptjs from "bcryptjs";
import { InMemoryDbConnector } from "../src/config/dbConnector";
import { ApiError } from "../src/errors/apierror";
import { IFriend } from "../src/interfaces/IFriend";

let friendCollection: mongo.Collection;
let facade: FriendFacade;

describe("## Verify the Friends Facade ##", () => {

  before(async function () {
    const client = await InMemoryDbConnector.connect();
    const db = client.db("friendFacadeTestDB");
    console.log(db.databaseName)
    friendCollection = db.collection("friends");
    facade = new FriendFacade(db);
  });

  beforeEach(async () => {
    const hashedPW = await bcryptjs.hash("secret", 4);
    await friendCollection.deleteMany({});
    await friendCollection.insertMany([
      {
        firstName: "Peter",
        lastName: "Pan",
        email: "pp@b.dk",
        password: hashedPW,
        role: "user",
      },
      {
        firstName: "Donald",
        lastName: "Duck",
        email: "dd@b.dk",
        password: hashedPW,
        role: "user",
      },
      {
        firstName: "Ad",
        lastName: "Admin",
        email: "aa@a.dk",
        password: hashedPW,
        role: "admin",
      },
    ]);
  });

  describe("Verify the addFriend method", () => {
    it("It should Add the user Jan", async () => {
      const newFriend = {
        firstName: "Jan",
        lastName: "Olsen",
        email: "jan@b.dk",
        password: "secret",
      };
      const status = await facade.addFriend(newFriend);
      expect(status).to.be.not.null;
      const jan: IFriend = await friendCollection.findOne({
        email: "jan@b.dk",
      });
      expect(jan.firstName).to.be.equal("Jan");
    });

    it("It should not add a user with a role (validation fails)", async () => {
      const newFriend = {
        firstName: "Jan",
        lastName: "Olsen",
        email: "jan@b.dk",
        password: "secret",
        role: "admin",
      };
      await expect(facade.addFriend(newFriend)).to.be.rejectedWith(ApiError)
    });
  });

  describe("Verify the editFriend method", () => {
    it("It should change lastName to XXXX", async () => {
      const newFriend = {
        firstName: "Peter",
        lastName: "XXXX",
        email: "pp@b.dk",
        password: "secret",
      };
      const status = await facade.editFriend("pp@b.dk", newFriend);
      expect(status).to.be.not.null;
      const cUser: IFriend = await friendCollection.findOne({
        email: "pp@b.dk",
      });
      //console.log( "---------" + cUser.lastName)
      expect(cUser.lastName).to.be.equal("XXXX");
    });
  });

  describe("Verify the deleteFriend method", () => {
    it("It should remove the user Peter", async () => {
      const status = await facade.deleteFriend("pp@b.dk");
      expect(status).to.be.true;
    });
    it("It should return false, for a user that does not exist", async () => {
      const status = await facade.deleteFriend("paasp@b.dk");
      expect(status).to.be.false;
    });
  });

  describe("Verify the getAllFriends method", () => {
    it("It should get three friends", async () => {
      const status = await facade.getAllFriends();
      expect(status.length).to.be.equal(3);
    });
  });

  describe("Verify the getFriend method", () => {
    it("It should find Donald Duck", async () => {
      const user = await facade.getFriend("dd@b.dk");
      expect(user.firstName).to.be.equal("Donald");
    });
    it("It should not find xxx.@.b.dk", async () => {
      expect(facade.getFriend("xxx.@.b.dk")).to.be.rejectedWith(ApiError, "No person found with given email");
    });
  });

  describe("Verify the getVerifiedUser method", () => {
    it("It should correctly validate Peter Pan's credential,s", async () => {
      const veriefiedPeter = await facade.getVerifiedUser("pp@b.dk", "secret");
      expect(veriefiedPeter).to.be.not.null;
    });

    it("It should NOT validate Peter Pan's credential,s", async () => {
      const veriefiedPeter = await facade.getVerifiedUser("pp@b.dk", "secret2");
      expect(veriefiedPeter).to.be.null;
    });

    it("It should NOT validate a non-existing users credentials", async () => {
      const veriefiedPeter = await facade.getVerifiedUser(
        "dick@ost.dk",
        "secret2"
      );
      expect(veriefiedPeter).to.be.null;
    });
  });
});
