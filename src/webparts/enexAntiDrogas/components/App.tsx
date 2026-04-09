import React, { useState, useEffect } from 'react';
import { Pill, Beaker, History as HistoryIcon, LayoutDashboard, Dices, ClipboardList, X } from 'lucide-react';
import TestForm from './components/TestForm';
import PendingList from './components/PendingList';
import PendingMonthly from './components/PendingMonthly';
import History from './components/History';
import Roulette from './components/Roulette';
import { SharePointService } from '../services/SharePointService';
import { IEnexAntiDrogasProps } from './IEnexAntiDrogasProps';

declare global {
    interface Window {
        api: any;
    }
}

const logo: any = require('../assets/enex-logo.png');

const App = (props: IEnexAntiDrogasProps) => {
    // Initialize API globally if not already set
    if (!window.api) {
        window.api = SharePointService.getInstance();
    }

    const [activeTab, setActiveTab] = useState('alcohol');
    const [pendingCount, setPendingCount] = useState(0);
    const [monthlyPendingCount, setMonthlyPendingCount] = useState(0);
    const [selectedSubject, setSelectedSubject] = useState<any>(null);
    const [modalSubject, setModalSubject] = useState<any>(null);
    const [isProvisioning, setIsProvisioning] = useState(true);

    const updatePendingCount = async () => {
        try {
            const pending = await window.api.getPending();
            setPendingCount(pending.length);
        } catch (error) {
            console.error("Error fetching pending count:", error);
        }
    };

    const updateMonthlyPendingCount = async () => {
        try {
            const currentMonth = new Date().toISOString().slice(0, 7);
            const pending = await window.api.getPendingMonthly(currentMonth);
            setMonthlyPendingCount(pending.length);
        } catch (error) {
            console.error("Error fetching monthly pending:", error);
        }
    };

    const updateAllCounts = () => {
        updatePendingCount();
        updateMonthlyPendingCount();
    };

    useEffect(() => {
        const init = async () => {
            await (window.api as SharePointService).ensureSchema();
            setIsProvisioning(false);
            updateAllCounts();
        };
        init();
    }, []);

    const handleSubmitTest = async (data: any) => {
        try {
            await window.api.insertTest(data);
            alert('Test registrado correctamente');
            updateAllCounts();
            if (activeTab === 'alcohol' && selectedSubject) {
                setSelectedSubject(null);
            }
            if (modalSubject) {
                setModalSubject(null);
            }
        } catch (error) {
            console.error("Error saving test", error);
            alert("Error al guardar test");
        }
    };

    const handleTakeTest = (subject: any) => {
        setModalSubject(subject);
    };

    const handleMenuClick = (tab: any) => {
        if (tab === 'alcohol') {
            setSelectedSubject(null);
        }
        setActiveTab(tab);
    };

    const navItems = [
        {
            id: 'alcohol',
            label: 'Nuevo Test Alcohol',
            icon: <Beaker size={16} />,
        },
        {
            id: 'droga',
            label: 'Nuevo Test Droga',
            icon: <Pill size={16} />,
        },
        {
            id: 'ruleta',
            label: 'Ruleta Aleatoria',
            icon: <Dices size={16} />,
        },
        {
            id: 'pendientes',
            label: 'Pendientes',
            icon: <LayoutDashboard size={16} />,
            badge: pendingCount,
            badgeColor: 'amber',
        },
        {
            id: 'historial',
            label: 'Historial y Reportes',
            icon: <HistoryIcon size={16} />,
        },
        {
            id: 'pending-monthly',
            label: 'Test Pendientes',
            icon: <ClipboardList size={16} />,
            badge: monthlyPendingCount,
            badgeColor: 'red',
        },
    ];

    const getPageTitle = () => {
        for (let i = 0; i < navItems.length; i++) {
            if (navItems[i].id === activeTab) return navItems[i].label;
        }
        return '';
    };

    if (isProvisioning) {
        return (
            <div style={{
                display: 'flex',
                minHeight: '500px',
                width: '100%',
                alignItems: 'center',
                justifyContent: 'center',
                flexDirection: 'column',
                background: '#f3f2f1',
                fontFamily: "'Segoe UI', system-ui, sans-serif",
            }}>
                <div style={{
                    width: 48,
                    height: 48,
                    border: '3px solid #003366',
                    borderTopColor: 'transparent',
                    borderRadius: '50%',
                    animation: 'spin 0.8s linear infinite',
                }} />
                <p style={{ marginTop: 16, color: '#003366', fontWeight: 600, fontSize: 15 }}>
                    Configurando entorno de SharePoint...
                </p>
                <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
            </div>
        );
    }

    return (
        <div className="enex-app-container" style={{
            width: '100%',
            minHeight: '700px',
            display: 'flex',
            flexDirection: 'column',
            fontFamily: "'Segoe UI', system-ui, -apple-system, sans-serif",
            background: '#f3f2f1',
            color: '#323130',
        }}>
            {/* ── SP-style Header bar ─────────────────────────────────────── */}
            <div style={{
                background: '#003366',
                color: '#fff',
                padding: '0 24px',
                display: 'flex',
                alignItems: 'center',
                gap: 16,
                height: 52,
                boxShadow: '0 2px 4px rgba(0,0,0,0.18)',
                flexShrink: 0,
            }}>
                <img
                    src={logo}
                    alt="Enex Logo"
                    style={{ height: 30, background: 'white', padding: '3px 8px', borderRadius: 4 }}
                />
                <div style={{ width: 1, height: 28, background: 'rgba(255,255,255,0.25)', margin: '0 4px' }} />
                <span style={{ fontWeight: 700, fontSize: 16, letterSpacing: 0.2 }}>Control Test</span>
                <span style={{ fontSize: 14, opacity: 0.75, marginLeft: 4 }}>· Planta San Vicente</span>

                {/* right side spacer + date */}
                <div style={{ flex: 1 }} />
                <span style={{ fontSize: 12, opacity: 0.65 }}>
                    {new Date().toLocaleDateString('es-CL', { weekday: 'long', day: 'numeric', month: 'long' })}
                </span>
            </div>

            {/* ── SP Command Bar / Navigation ─────────────────────────────── */}
            <div style={{
                background: '#fff',
                borderBottom: '1px solid #edebe9',
                padding: '0 24px',
                display: 'flex',
                alignItems: 'stretch',
                gap: 0,
                flexShrink: 0,
                boxShadow: '0 1px 3px rgba(0,0,0,0.07)',
                overflowX: 'auto',
            }}>
                {navItems.map(item => {
                    const isActive = activeTab === item.id;
                    return (
                        <button
                            key={item.id}
                            onClick={() => handleMenuClick(item.id)}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 7,
                                padding: '0 18px',
                                height: 46,
                                background: 'transparent',
                                border: 'none',
                                borderBottom: isActive ? '2.5px solid #003366' : '2.5px solid transparent',
                                color: isActive ? '#003366' : '#605e5c',
                                fontWeight: isActive ? 700 : 500,
                                fontSize: 14,
                                cursor: 'pointer',
                                whiteSpace: 'nowrap',
                                transition: 'color 0.15s, border-color 0.15s',
                                position: 'relative',
                            }}
                            onMouseEnter={e => {
                                if (!isActive) (e.currentTarget as HTMLButtonElement).style.color = '#201f1e';
                            }}
                            onMouseLeave={e => {
                                if (!isActive) (e.currentTarget as HTMLButtonElement).style.color = '#605e5c';
                            }}
                        >
                            {item.icon}
                            {item.label}
                            {item.badge !== undefined && item.badge > 0 && (
                                <span style={{
                                    background: item.badgeColor === 'red' ? '#d13438' : '#f7d948',
                                    color: item.badgeColor === 'red' ? '#fff' : '#201f1e',
                                    fontSize: 11,
                                    fontWeight: 700,
                                    borderRadius: 10,
                                    padding: '1px 6px',
                                    minWidth: 18,
                                    textAlign: 'center',
                                    lineHeight: '16px',
                                }}>
                                    {item.badge}
                                </span>
                            )}
                        </button>
                    );
                })}
            </div>

            {/* ── Breadcrumb / Page title ──────────────────────────────────── */}
            <div style={{
                padding: '14px 28px 10px',
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                flexShrink: 0,
            }}>
                <span style={{ fontSize: 12, color: '#797775', cursor: 'default' }}>Control Test</span>
                <span style={{ fontSize: 12, color: '#797775' }}>›</span>
                <span style={{ fontSize: 12, color: '#323130', fontWeight: 600 }}>{getPageTitle()}</span>
            </div>

            {/* ── Main content area ────────────────────────────────────────── */}
            <main style={{
                flex: 1,
                padding: '0 0 28px',
                overflowY: 'auto',
            }}>
                {/* Content card wrapper – matches SP "modern page web part" style */}
                <div style={{
                    background: '#ffffff',
                    padding: '24px 28px',
                    minHeight: 520,
                    width: '100%',
                    boxSizing: 'border-box'
                }}>
                    {activeTab === 'alcohol' && (
                        <TestForm
                            key={`alcohol-${selectedSubject ? selectedSubject.rut : 'new'}`}
                            tipoTest="alcohol"
                            onSubmit={handleSubmitTest}
                            initialData={selectedSubject}
                        />
                    )}
                    {activeTab === 'droga' && <TestForm key="droga" tipoTest="droga" onSubmit={handleSubmitTest} />}
                    {activeTab === 'ruleta' && <Roulette />}
                    {activeTab === 'pendientes' && <PendingList onUpdate={updateAllCounts} />}
                    {activeTab === 'historial' && <History onUpdate={updateAllCounts} />}
                    {activeTab === 'pending-monthly' && (
                        <PendingMonthly onTakeTest={handleTakeTest} onUpdateCount={setMonthlyPendingCount} />
                    )}
                </div>
            </main>

            {/* Test Modal (from Pending Monthly) */}
            {modalSubject && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-[100] p-4 no-print transition-all">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl relative overflow-y-auto max-h-[95vh] border border-white/20">
                        <button
                            onClick={() => setModalSubject(null)}
                            className="absolute top-6 right-6 text-gray-400 hover:text-gray-600 hover:bg-gray-100 p-2 rounded-full transition-all z-10"
                            title="Cerrar"
                        >
                            <X size={20} />
                        </button>
                        <div className="p-2">
                            <TestForm
                                key={`modal-${modalSubject.rut}`}
                                tipoTest="alcohol"
                                onSubmit={handleSubmitTest}
                                initialData={modalSubject}
                            />
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default App;
