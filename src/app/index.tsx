import "@/styles/global.css"
import { Text, View } from "react-native";

export default function App() {
    return (
        <View className="flex-1 items-center justify-center bg-white">
            <Text className="font-sans text-title font-ui-700">
                Welcome to Nativewind!
            </Text>
        </View>
    );
}