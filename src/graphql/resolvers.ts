import FriendFacade from "../facades/friendFacade";
import PositionFacade from "../facades/positionFacade"
import { IFriend } from "../interfaces/IFriend";
import { ApiError } from "../errors/apierror";
import { Request } from "express";
import fetch from "node-fetch";
import { updateImportEqualsDeclaration } from "typescript";
//import { in } from "joi";

let friendFacade: FriendFacade;
let positionFacade: PositionFacade;

interface IPositionInput {
  email: string,
  longitude: number,
  latitude: number
}

interface IPositionInputWithDistance {
  email: string,
  longitude: number,
  latitude: number,
  distance: number
}

/*
We don't have access to app or the Router so we need to set up the facade in another way
In www.ts IMPORT and CALL the method below, like so: 
      setupFacade(db);
Just before the line where you start the server
*/
export function setupFacade(db: any) {
  if (!friendFacade) {
    friendFacade = new FriendFacade(db);
  }
  if (!positionFacade) {
    positionFacade = new PositionFacade(db);
  }
}

// resolver map
export const resolvers = {
  Query: {
    allFriends: (root: any, _: any, req: any) => {
      console.log(req.credentials);
      // if (
      //   !req.credentials ||
      //   !req.credentials.role ||
      //   req.credentials.role !== "admin"
      // ) {
      //   throw new ApiError("Not Authorized", 401);
      // }

      return friendFacade.getAllFriendsV2();
    },
    getFriendByEmail: async (_: object, { input }: { input: string }) => {
      return friendFacade.getFriendFromEmail(input);
    }
  },
  Mutation: {
    createFriend: async (_: object, { input }: { input: IFriend }) => {
      return friendFacade.addFriendV2(input);
    },
    updateFriend: async (_: object, { input }: { input: IFriend }) => {
      return friendFacade.editFriendV2(input.email, input);
    },
    deleteFriend: async (_: object, { input }: { input: string }) => {
      return friendFacade.deleteFriend(input);
    },
    addOrUpdatePosition: async (_: object, { input }: { input: IPositionInput }) => {
      const result = positionFacade.addOrUpdatePosition(input.email, input.longitude, input.latitude);
      if ((await result).name) {
        return true
      }
      return false
    },
    findNearbyPlayers: async (_: object, {input}: {input: IPositionInputWithDistance}) => {
      return positionFacade.findNearbyFriends(input.email, input.longitude, input.latitude, input.distance);
    }
  }
};
