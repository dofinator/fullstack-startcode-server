import { makeExecutableSchema } from "graphql-tools";
import { resolvers } from "./resolvers";

const typeDefs = `#graphql


    type Friend {
        id: ID
        firstName: String
        lastName: String
        email: String
        role: String
    }


    type Point {
        type: String
        coordinates: [Float]
    } 

    type FriendPosition {
        email: String
        name: String
        location: Point
    }
    
    """
    Queries available for Friends
    """
    type Query {
        getFriendByEmail(input: String): Friend
        allFriends: [Friend]!
        getAllFriendsProxy: [Friend]!
    }
    input FriendInput {
        firstName: String!
        lastName: String!
        password: String!
        email: String!
    }

    input PositionInput {
        email: String!
        longitude: Float!
        latitude: Float!
    }

    input PositionInputWithDistance {
        email: String!
        longitude: Float!
        latitude: Float!
        distance: Float!
    }
    

    type Mutation {
        createFriend(input: FriendInput): Friend
        updateFriend(input: FriendInput): Friend
        deleteFriend(id: ID!): String
        addOrUpdatePosition(input: PositionInput): Boolean
        findNearbyPlayers(input: PositionInputWithDistance): [FriendPosition]
    }
        
`;

const schema = makeExecutableSchema({ typeDefs, resolvers });

export { schema };
