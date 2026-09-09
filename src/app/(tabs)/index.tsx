import { Link } from "expo-router";
import { Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context"

export default function App() {
    return (
            <View className="flex-1 bg-bg-app p-safe">
                <Text className="text-title text-t1 font-ui-700">
                    Welcome to Nativewind!
                </Text>
                <Link href="/(tabs)/account">
                    <Text className="text-body text-t1">Go to Account</Text></Link>
                <Link href="/(tabs)/history">
                    <Text className="text-body text-t1">Go to History</Text></Link>
            </View>
    );
}