import { Link } from "expo-router";
import { Pressable, Text, View } from "react-native";
import { Icon } from "@/components/Icon";

/* Placeholder until AuthClient / SubscriptionClient are wired. */
const FREE_SCANS_PER_MONTH = 2;
const user = { name: "Jonatas Mendes", plan: "Free", scansLeft: 1 };
const allowanceResetsAt = "1 October";

function shortDate(iso: string) {
    return new Date(iso).toLocaleDateString(undefined, { day: "numeric", month: "short" });
}

function initialOf(name: string) {
    return name.trim().charAt(0).toUpperCase();
}

export default function Home() {
    const today = new Date().toLocaleDateString("en-US", {
        weekday: "long",
        day: "2-digit",
        month: "short",
    });

    const scansLeft = Math.max(0, Math.min(user.scansLeft, FREE_SCANS_PER_MONTH));

    return (
        <View className="flex-1 bg-bg-app pt-safe">
            <View className="mx-6 mt-3">
                {/* Header */}
                <View className="flex-row justify-between items-center">
                    <View className="flex-row items-center gap-3">
                        <View className="w-12 h-12 rounded-pill bg-person-1 items-center justify-center">
                            <Text className="text-row font-ui-800 text-person-1-ink">
                                {initialOf(user.name)}
                            </Text>
                        </View>
                        <Text className="text-row font-ui-700 text-t1">{user.name}</Text>
                    </View>
                    <Text className="text-label font-ui-700 text-t4">{today.toUpperCase()}</Text>
                </View>

                {/* Allowance + primary action */}
                <View className="mt-6 p-6 bg-am07 border border-am-line18 rounded-card gap-4">
                    <View className="flex-row justify-between items-center">
                        <Text className="text-body font-ui-700 text-accent-text">
                            {scansLeft} of {FREE_SCANS_PER_MONTH} free scans left
                        </Text>
                        <Link href="/account" asChild>
                            <Pressable accessibilityRole="button">
                                <Text className="text-body font-ui-700 text-accent-text">Go unlimited</Text>
                            </Pressable>
                        </Link>
                    </View>

                    <View className="flex-row gap-2">
                        {Array.from({ length: FREE_SCANS_PER_MONTH }, (_, i) => (
                            <View
                                key={i}
                                className={`h-2 flex-1 rounded-pill ${i < scansLeft ? "bg-accent" : "bg-bd-control"}`}
                            />
                        ))}
                    </View>

                    <Text className="text-body font-ui-500 text-t4">
                        Allowance resets {allowanceResetsAt}
                    </Text>

                    <Link href="/bill/new/capture" asChild>
                        <Pressable
                            accessibilityRole="button"
                            className="flex-row justify-center items-center gap-2 py-4 bg-accent rounded-row active:opacity-80"
                        >
                            <Icon name="camera-outline" size={30} className="text-person-1-ink" />
                            <Text className="text-headline font-ui-800 text-person-1-ink">Scan new receipt</Text>
                        </Pressable>
                    </Link>
                </View>

            </View>
        </View>
    );
}
