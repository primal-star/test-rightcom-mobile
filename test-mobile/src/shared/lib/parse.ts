import AsyncStorage from "@react-native-async-storage/async-storage";
import Parse from "parse/react-native.js";
import { Platform } from "react-native";

const defaultHost = Platform.OS === "android" ? "10.0.2.2" : "localhost";
const serverURL =
  process.env.EXPO_PUBLIC_PARSE_SERVER_URL ??
  `http://${defaultHost}:1337/parse`;

Parse.setAsyncStorage(AsyncStorage);

// Parse 8.7 types require a second argument; this server does not require a key.
Parse.initialize("blog-app", "");

Parse.serverURL = serverURL;

export { Parse };
