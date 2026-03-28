import 'react-native-gesture-handler';
import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { ActivityIndicator, Text, View } from 'react-native';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useAuthStore } from './src/store';

// Screens
import { LoginScreen } from './src/screens/LoginScreen';
import { RegisterScreen } from './src/screens/RegisterScreen';
import { HomeScreen } from './src/screens/HomeScreen';
import { ExploreScreen } from './src/screens/ExploreScreen';
import { WatchlistScreen } from './src/screens/WatchlistScreen';
import { SocialScreen } from './src/screens/SocialScreen';
import { ProfileScreen } from './src/screens/ProfileScreen';
import { MovieDetailScreen } from './src/screens/MovieDetailScreen';
import { MessagesScreen } from './src/screens/MessagesScreen';
import { DashboardScreen } from './src/screens/DashboardScreen';
import { ActorProfileScreen } from './src/screens/ActorProfileScreen';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

function getTabBarIcon(name: string): React.ComponentProps<typeof MaterialIcons>['name'] {
  const icons: Record<string, React.ComponentProps<typeof MaterialIcons>['name']> = {
    Home: 'home',
    Explore: 'search',
    Watchlist: 'bookmark-outline',
    Social: 'groups',
    Dashboard: 'bar-chart',
    Profile: 'person-outline',
  };
  return icons[name] || 'lens';
}

function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ color, size }) => <MaterialIcons name={getTabBarIcon(route.name)} size={size} color={color} />,
        tabBarActiveTintColor: '#dc2626',
        tabBarInactiveTintColor: '#666',
        tabBarStyle: {
          backgroundColor: '#1a1a1a',
          borderTopColor: '#2a2a2a',
          borderTopWidth: 1,
        },
        headerShown: true,
        headerStyle: {
          backgroundColor: '#1a1a1a',
        },
        headerTintColor: '#fff',
        headerTitleStyle: {
          fontWeight: 'bold',
          color: '#fff',
        },
      })}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{ title: 'Film Tracker' }}
      />
      <Tab.Screen
        name="Explore"
        component={ExploreScreen}
        options={{ title: 'Explore' }}
      />
      <Tab.Screen
        name="Watchlist"
        component={WatchlistScreen}
        options={{ title: 'My Watchlist' }}
      />
      <Tab.Screen
        name="Social"
        component={SocialScreen}
        options={{ title: 'Friends' }}
      />
      <Tab.Screen
        name="Dashboard"
        component={DashboardScreen}
        options={{ title: 'Dashboard' }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{ title: 'Profile' }}
      />
    </Tab.Navigator>
  );
}

function AuthStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen
        name="Login"
        component={LoginScreen}
      />
      <Stack.Screen
        name="Register"
        component={RegisterScreen}
      />
    </Stack.Navigator>
  );
}

function RootStack() {
  const { user, initializeAuth, token } = useAuthStore();
  const [isLoading, setIsLoading] = React.useState(true);

  React.useEffect(() => {
    const bootstrap = async () => {
      await initializeAuth();
      setIsLoading(false);
    };

    bootstrap();
  }, []);

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#1a1a1a' }}>
        <ActivityIndicator size="large" color="#dc2626" />
      </View>
    );
  }

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {token && user ? (
        <Stack.Group>
          <Stack.Screen
            name="MainStack"
            component={MainTabs}
            options={{ animation: 'none' }}
          />
          <Stack.Group screenOptions={{ presentation: 'modal' }}>
            <Stack.Screen
              name="MovieDetail"
              component={MovieDetailScreen}
              options={{
                headerShown: true,
                headerStyle: {
                  backgroundColor: '#1a1a1a',
                },
                headerTintColor: '#fff',
                headerTitle: 'Movie Details',
              }}
            />
            <Stack.Screen
              name="Messages"
              component={MessagesScreen}
              options={{
                headerShown: true,
                headerStyle: {
                  backgroundColor: '#1a1a1a',
                },
                headerTintColor: '#fff',
                headerTitle: 'Messages',
              }}
            />
            <Stack.Screen
              name="ActorProfile"
              component={ActorProfileScreen}
              options={{
                headerShown: true,
                headerStyle: {
                  backgroundColor: '#1a1a1a',
                },
                headerTintColor: '#fff',
                headerTitle: 'Actor Profile',
              }}
            />
          </Stack.Group>
        </Stack.Group>
      ) : (
        <Stack.Screen
          name="Auth"
          component={AuthStack}
          options={{ animation: 'none' }}
        />
      )}
    </Stack.Navigator>
  );
}

export default function App() {
  return (
    <NavigationContainer>
      <RootStack />
    </NavigationContainer>
  );
}
