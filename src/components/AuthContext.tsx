import React, { createContext, useEffect, useContext } from "react";
import { apiClient } from "../utils/apis";

export interface User {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    profilePicture?: string; // URL or base64 string for custom image
    avatarId?: string; // ID for predefined avatar
    token?: string; // Optional token for authenticated requests
    authProvider?: 'local' | 'google' | 'github';
    isEmailVerified?: boolean;
}

interface AuthContextType {
    isAuthenticated: boolean;
    user: User | null;
    login: (user: any) => Promise<any>;
    logout: () => void;
    register: (user: any) => Promise<any>;
    loginWithGoogle: () => void;
    loginWithGitHub: () => void;
    handleOAuthCallback: (token: string, provider: string) => Promise<any>;
}

export const AuthContext = createContext<AuthContextType>({
    isAuthenticated: false,
    user: null,
    login: async () => { },
    logout: () => { },
    register: async () => { },
    loginWithGoogle: () => { },
    loginWithGitHub: () => { },
    handleOAuthCallback: async () => { },
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
    children,
}) => {
    const [isAuthenticated, setIsAuthenticated] = React.useState(false);
    const [user, setUser] = React.useState(null);

    useEffect(() => {
        // Check if user is authenticated on initial load
        const token = localStorage.getItem("authToken");
        if (token) {
            apiClient.verifyToken(token)
                .then((response: any) => {
                    if (response.success) {
                        setUser(response.data);
                        setIsAuthenticated(true);
                    } else {
                        console.error('Token verification failed:', response.message);
                        setUser(null);
                        setIsAuthenticated(false);
                    }
                })
                .catch((error) => {
                    console.error('An error occurred during token verification:', error);
                    setUser(null);
                    setIsAuthenticated(false);
                });
        } else {
            setUser(null);
            setIsAuthenticated(false);
        }
    }, []);

    const login = (user: any) => {
        return apiClient.login(user.email, user.password)
            .then((response: any) => {
                if (response.success) {
                    setUser(response.data);
                    setIsAuthenticated(true);
                    apiClient.setToken(response.token); // Use API client method for consistency
                    return response; // Return the response for the caller to handle
                } else {
                    console.error('Login failed:', response.message);
                    throw new Error(response.message || 'Login failed');
                }
            })
            .catch((error) => {
                console.error('An error occurred during login:', error);
                throw error; // Re-throw the error so the caller can handle it
            });
    }

    const register = (user: any) => {
        return apiClient.register(user.firstName, user.lastName, user.email, user.password)
            .then((response: any) => {
                if (response.success) {
                    setUser(response.data);
                    setIsAuthenticated(true);
                    apiClient.setToken(response.token); // Use API client method for consistency
                    return response; // Return the response for the caller to handle
                } else {
                    console.error('Signup failed:', response.message);
                    throw new Error(response.message || 'Signup failed');
                }
            })
            .catch((error) => {
                console.error('An error occurred during signup:', error);
                throw error; // Re-throw the error so the caller can handle it
            });
    }

    const logout = () => {
        setUser(null);
        setIsAuthenticated(false);
        apiClient.clearToken();
    };

    const loginWithGoogle = () => {
        window.location.href = `${import.meta.env.VITE_API_URL || 'http://localhost:7007'}/api/auth/google`;
    };

    const loginWithGitHub = () => {
        window.location.href = `${import.meta.env.VITE_API_URL || 'http://localhost:7007'}/api/auth/github`;
    };

    const handleOAuthCallback = async (token: string, provider: string) => {
        try {
            const response: any = await apiClient.verifyOAuthToken(token, provider);
            if (response.success) {
                setUser(response.data);
                setIsAuthenticated(true);
                apiClient.setToken(response.token);
                return response;
            } else {
                throw new Error(response.message || 'OAuth verification failed');
            }
        } catch (error) {
            console.error('OAuth callback error:', error);
            throw error;
        }
    };

    return (
        <AuthContext.Provider value={{
            isAuthenticated,
            user,
            login,
            register,
            logout,
            loginWithGoogle,
            loginWithGitHub,
            handleOAuthCallback
        }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};