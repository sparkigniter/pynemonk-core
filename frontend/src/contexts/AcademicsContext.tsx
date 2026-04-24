import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { academicsApi } from '../api/academics.api';

interface AcademicYear {
    id: number;
    name: string;
    start_date: string;
    end_date: string;
    is_current: boolean;
    status: 'planning' | 'active' | 'closed';
}

interface AcademicsContextType {
    currentYear: AcademicYear | null;
    years: AcademicYear[];
    loading: boolean;
    refreshYears: () => Promise<void>;
    isYearClosed: (yearId?: number) => boolean;
}

const AcademicsContext = createContext<AcademicsContextType | undefined>(undefined);

export const AcademicsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [currentYear, setCurrentYear] = useState<AcademicYear | null>(null);
    const [years, setYears] = useState<AcademicYear[]>([]);
    const [loading, setLoading] = useState(true);

    const refreshYears = useCallback(async () => {
        setLoading(true);
        try {
            const data = await academicsApi.getYears();
            setYears(data);
            const active = data.find((y: any) => y.is_current);
            if (active) {
                setCurrentYear(active);
            }
        } catch (err) {
            console.error('Failed to fetch academic years:', err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        refreshYears();
    }, [refreshYears]);

    const isYearClosed = useCallback((yearId?: number) => {
        const year = yearId ? years.find(y => y.id === yearId) : currentYear;
        return year?.status === 'closed';
    }, [years, currentYear]);

    return (
        <AcademicsContext.Provider value={{ currentYear, years, loading, refreshYears, isYearClosed }}>
            {children}
        </AcademicsContext.Provider>
    );
};

export const useAcademics = () => {
    const context = useContext(AcademicsContext);
    if (context === undefined) {
        throw new Error('useAcademics must be used within an AcademicsProvider');
    }
    return context;
};
