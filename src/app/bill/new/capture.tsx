import { Text, View } from "react-native";

/* Route stub (SPEC §14, M1). Capture is step 2 of the flow; the tab bar stays
   hidden for the whole of /bill/new/*, which this route already is by living
   outside the (tabs) group. */
export default function Capture() {
    return (
        <View className="flex-1 bg-bg-app items-center justify-center">
            <Text className="text-row font-ui-600 text-t1">Capture</Text>
        </View>
    );
}
