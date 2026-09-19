import type { Bill } from "@/types/bill";

/**
 * Fixed sample bill used by the mock clients while the flow is built on fake
 * data. Prices are pence. Every item has at least one person and every person
 * has at least one item, so the mock passes the service-charge gate.
 */
export const mockBill: Bill = {
    id: "bill_mock_1",
    restaurantName: "The Copper Kettle",
    currency: "GBP",
    serviceChargePercent: 12.5,
    splitMode: "itemised",
    createdAt: "2026-09-19T19:24:00.000Z",
    people: [
        { id: "b1_person_1", name: "Jonatas", color: "person-1", isHost: true },
        { id: "b1_person_2", name: "Amara", color: "person-2", isHost: false },
        { id: "b1_person_3", name: "Dev", color: "person-3", isHost: false },
        { id: "b1_person_4", name: "Rosie", color: "person-4", isHost: false },
    ],
    items: [
        {
            id: "b1_item_1",
            name: "Padrón Peppers",
            price: 750,
            assignedTo: [
                "b1_person_1",
                "b1_person_2",
                "b1_person_3",
                "b1_person_4",
            ],
        },
        {
            id: "b1_item_2",
            name: "Sourdough & Butter",
            price: 450,
            assignedTo: ["b1_person_1", "b1_person_2"],
        },
        {
            id: "b1_item_3",
            name: "Ribeye Steak",
            price: 2650,
            assignedTo: ["b1_person_1"],
        },
        {
            id: "b1_item_4",
            name: "Sea Bass",
            price: 1950,
            assignedTo: ["b1_person_2"],
        },
        {
            id: "b1_item_5",
            name: "Mushroom Risotto",
            price: 1595,
            assignedTo: ["b1_person_3"],
        },
        {
            id: "b1_item_6",
            name: "Roast Chicken",
            price: 1775,
            assignedTo: ["b1_person_4"],
        },
        {
            id: "b1_item_7",
            name: "Triple-Cooked Chips",
            price: 550,
            assignedTo: ["b1_person_1", "b1_person_3", "b1_person_4"],
        },
        {
            id: "b1_item_8",
            name: "House Red (Bottle)",
            price: 2800,
            assignedTo: ["b1_person_2", "b1_person_3", "b1_person_4"],
        },
        {
            id: "b1_item_9",
            name: "Sparkling Water",
            price: 395,
            assignedTo: [
                "b1_person_1",
                "b1_person_2",
                "b1_person_3",
                "b1_person_4",
            ],
        },
        {
            id: "b1_item_10",
            name: "Sticky Toffee Pudding",
            price: 825,
            assignedTo: ["b1_person_1", "b1_person_4"],
        },
    ],
};

/**
 * Two people, one of them the host, and an odd number of shared items — the
 * smallest bill that still produces a remainder for the host to absorb.
 */
export const mockBillRamen: Bill = {
    id: "bill_mock_2",
    restaurantName: "Sakura Ramen Bar",
    currency: "GBP",
    serviceChargePercent: 10,
    splitMode: "itemised",
    createdAt: "2026-09-12T12:40:00.000Z",
    people: [
        { id: "b2_person_1", name: "Jonatas", color: "person-1", isHost: true },
        { id: "b2_person_2", name: "Priya", color: "person-2", isHost: false },
    ],
    items: [
        {
            id: "b2_item_1",
            name: "Gyoza (6)",
            price: 695,
            assignedTo: ["b2_person_1", "b2_person_2"],
        },
        {
            id: "b2_item_2",
            name: "Edamame",
            price: 425,
            assignedTo: ["b2_person_1", "b2_person_2"],
        },
        {
            id: "b2_item_3",
            name: "Tonkotsu Ramen",
            price: 1395,
            assignedTo: ["b2_person_1"],
        },
        {
            id: "b2_item_4",
            name: "Spicy Miso Ramen",
            price: 1345,
            assignedTo: ["b2_person_2"],
        },
        {
            id: "b2_item_5",
            name: "Green Tea",
            price: 275,
            assignedTo: ["b2_person_2"],
        },
        {
            id: "b2_item_6",
            name: "Asahi 330ml",
            price: 525,
            assignedTo: ["b2_person_1"],
        },
    ],
};

/**
 * Equal split: every person is assigned to every item. The stored data is the
 * only difference from an itemised bill — the money layer does not branch.
 */
export const mockBillPizza: Bill = {
    id: "bill_mock_3",
    restaurantName: "Bruno's Pizzeria",
    currency: "GBP",
    serviceChargePercent: 12.5,
    splitMode: "equal",
    createdAt: "2026-08-29T20:05:00.000Z",
    people: [
        { id: "b3_person_1", name: "Jonatas", color: "person-1", isHost: true },
        { id: "b3_person_2", name: "Marco", color: "person-2", isHost: false },
        { id: "b3_person_3", name: "Elena", color: "person-3", isHost: false },
    ],
    items: [
        {
            id: "b3_item_1",
            name: "Garlic Bread",
            price: 599,
            assignedTo: ["b3_person_1", "b3_person_2", "b3_person_3"],
        },
        {
            id: "b3_item_2",
            name: "Margherita",
            price: 1099,
            assignedTo: ["b3_person_1", "b3_person_2", "b3_person_3"],
        },
        {
            id: "b3_item_3",
            name: "Diavola",
            price: 1349,
            assignedTo: ["b3_person_1", "b3_person_2", "b3_person_3"],
        },
        {
            id: "b3_item_4",
            name: "Quattro Formaggi",
            price: 1299,
            assignedTo: ["b3_person_1", "b3_person_2", "b3_person_3"],
        },
        {
            id: "b3_item_5",
            name: "Tiramisu",
            price: 725,
            assignedTo: ["b3_person_1", "b3_person_2", "b3_person_3"],
        },
    ],
};

/**
 * A large pub round with no service charge — six people, the full palette in
 * use, and several items shared by lopsided subsets.
 */
export const mockBillPub: Bill = {
    id: "bill_mock_4",
    restaurantName: "The Anchor",
    currency: "GBP",
    serviceChargePercent: 0,
    splitMode: "itemised",
    createdAt: "2026-08-15T21:50:00.000Z",
    people: [
        { id: "b4_person_1", name: "Jonatas", color: "person-1", isHost: true },
        { id: "b4_person_2", name: "Tom", color: "person-2", isHost: false },
        { id: "b4_person_3", name: "Aisha", color: "person-3", isHost: false },
        { id: "b4_person_4", name: "Nina", color: "person-4", isHost: false },
        { id: "b4_person_5", name: "Callum", color: "person-5", isHost: false },
        { id: "b4_person_6", name: "Yuki", color: "person-6", isHost: false },
    ],
    items: [
        {
            id: "b4_item_1",
            name: "Sharing Board",
            price: 1850,
            assignedTo: [
                "b4_person_1",
                "b4_person_2",
                "b4_person_3",
                "b4_person_4",
                "b4_person_5",
                "b4_person_6",
            ],
        },
        {
            id: "b4_item_2",
            name: "Halloumi Fries",
            price: 695,
            assignedTo: ["b4_person_3", "b4_person_6"],
        },
        {
            id: "b4_item_3",
            name: "Fish & Chips",
            price: 1650,
            assignedTo: ["b4_person_2"],
        },
        {
            id: "b4_item_4",
            name: "Steak Pie",
            price: 1595,
            assignedTo: ["b4_person_1"],
        },
        {
            id: "b4_item_5",
            name: "Veggie Burger",
            price: 1450,
            assignedTo: ["b4_person_4"],
        },
        {
            id: "b4_item_6",
            name: "Sunday Roast",
            price: 1795,
            assignedTo: ["b4_person_5"],
        },
        {
            id: "b4_item_7",
            name: "Katsu Curry",
            price: 1550,
            assignedTo: ["b4_person_6"],
        },
        {
            id: "b4_item_8",
            name: "Chicken Caesar",
            price: 1495,
            assignedTo: ["b4_person_3"],
        },
        {
            id: "b4_item_9",
            name: "Round of Ales (4)",
            price: 2340,
            assignedTo: [
                "b4_person_1",
                "b4_person_2",
                "b4_person_5",
                "b4_person_6",
            ],
        },
        {
            id: "b4_item_10",
            name: "Elderflower Spritz",
            price: 890,
            assignedTo: ["b4_person_3", "b4_person_4"],
        },
        {
            id: "b4_item_11",
            name: "Lemonade",
            price: 330,
            assignedTo: ["b4_person_4"],
        },
    ],
};

/** Every mock bill, newest first — what `MockBillRepository` lists. */
export const mockBills: Bill[] = [
    mockBill,
    mockBillRamen,
    mockBillPizza,
    mockBillPub,
];

export default mockBill;
