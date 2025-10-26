import ProtectedRoute from "@/components/ProtectedRoute";
import { Stack } from "expo-router";
import React from "react";

export default function CreateTodoLayout() {
  return (
    <ProtectedRoute>
      <Stack>
        <Stack.Screen
          name="create-todo"
          options={{
            headerShown: false,
            presentation: "modal",
          }}
        />
      </Stack>
    </ProtectedRoute>
  );
}
