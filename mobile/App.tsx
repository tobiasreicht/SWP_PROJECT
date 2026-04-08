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
import { ExploreScreen } from './src/screens/ExploreScreen';
import { WatchlistScreen } from './src/screens/WatchlistScreen';
import { SocialScreen } from './src/screens/SocialScreen';
import { ProfileScreen } from './src/screens/ProfileScreen';
import { MessagesScreen } from './src/screens/MessagesScreen';
import { ActorProfileScreen } from './src/screens/ActorProfileScreen';

const HomeScreen = require('./src/screens/HomeScreen').HomeScreen;
const MovieDetailScreen = require('./src/screens/MovieDetailScreen').default;

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

function getTabBarIcon(name: string): React.ComponentProps<typeof MaterialIcons>['name'] {
  const icons: Record<string, React.ComponentProps<typeof MaterialIcons>['name']> = {
    Home: 'home',
    Explore: 'search',
    Watchlist: 'bookmark-outline',
    Social: 'groups',
    Profile: 'person-outline',
  };
  return icons[name] || 'lens';
}

function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ color, size }) => <MaterialIcons name={getTabBarIcon(route.name)} size={size} color={color} />,
        tabBarActiveTintColor: '#ef4444',
        tabBarInactiveTintColor: '#71717a',
        tabBarStyle: {
          backgroundColor: '#11131a',
          borderTopColor: '#2a3040',
          borderTopWidth: 1,
          height: 66,
          paddingBottom: 8,
          paddingTop: 6,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '700',
        },
        headerShown: true,
        headerStyle: {
          backgroundColor: '#11131a',
        },
        headerTintColor: '#fff',
        headerTitleStyle: {
          fontWeight: '700',
          color: '#fff',
        },
        sceneStyle: {
          backgroundColor: '#0d0f14',
        },
      })}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{
          title: 'Home',
          headerShown: false,
        }}
      />
      <Tab.Screen
        name="Explore"
        component={ExploreScreen}
        options={{ title: 'Explore', headerTitle: 'Explore' }}
      />
      <Tab.Screen
        name="Watchlist"
        component={WatchlistScreen}
        options={{ title: 'Watchlist', headerTitle: 'Watchlist' }}
      />
      <Tab.Screen
        name="Social"
        component={SocialScreen}
        options={{ title: 'Friends', headerTitle: 'Social' }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{ title: 'Profile', headerTitle: 'Profile' }}
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
        <ActivityIndicator size="large" color="#ef4444" />
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
                  backgroundColor: '#11131a',
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
                  backgroundColor: '#11131a',
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
                  backgroundColor: '#11131a',
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
