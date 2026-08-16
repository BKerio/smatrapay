import { useState, useEffect } from 'react';

export interface UserProfile {
    id: string;
    name: string;
    email: string;
    username: string;
    role: string;
    profile_image: string | null;
    bio: string | null;
    roles?: string[];
    permissions?: string[];
}

export const useAuth = () => {
    const [user, setUser] = useState<UserProfile | null>(null);

    useEffect(() => {
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
            try {
                setUser(JSON.parse(storedUser));
            } catch {
                setUser(null);
            }
        }
    }, []);

    const login = (userData: UserProfile, token: string) => {
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(userData));
        setUser(userData);
    };

    const logout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setUser(null);
    };

    return { user, login, logout };
};
