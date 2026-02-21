import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  FiChevronLeft, FiChevronRight, FiHome, FiMessageCircle, FiActivity, FiCheckSquare,
  FiBarChart2, FiUsers, FiTruck, FiTool, FiAlertTriangle, FiTag, FiAlertOctagon,
  FiDollarSign, FiDroplet, FiFolder, FiClipboard, FiFileText, FiSearch, FiFilter,
  FiClock, FiShield, FiHelpCircle, FiEye, FiRefreshCw, FiMoreVertical
} from 'react-icons/fi';
import PublicHeader from '../components/PublicHeader';
import { FooterSection } from '../components/landing';
import useForceLightMode from '../hooks/useForceLightMode';

const Platform = () => {
  useForceLightMode();

  const [currentSlide, setCurrentSlide] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [progress, setProgress] = useState(0);

  const autoplayDelay = 5000;
  const totalSlides = 5;

  const slideTitles = [
    { highlight: 'Dashboard', text: 'Real-time Compliance Overview' },
    { highlight: 'Compliance', text: 'SMS BASICs Monitoring' },
    { highlight: 'Driver Files', text: 'DQF Management & Credentials' },
    { highlight: 'Alerts', text: 'Smart Notification Center' },
    { highlight: 'VroomX AI', text: 'Intelligent Compliance Assistant' }
  ];

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const goToSlide = useCallback((index) => {
    setCurrentSlide(index);
    setProgress(0);
  }, []);

  const nextSlide = useCallback(() => {
    goToSlide((currentSlide + 1) % totalSlides);
  }, [currentSlide, goToSlide]);

  const prevSlide = useCallback(() => {
    goToSlide((currentSlide - 1 + totalSlides) % totalSlides);
  }, [currentSlide, goToSlide]);

  useEffect(() => {
    if (isPaused) return;
    const progressInterval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          nextSlide();
          return 0;
        }
        return prev + (100 / (autoplayDelay / 100));
      });
    }, 100);
    return () => clearInterval(progressInterval);
  }, [isPaused, nextSlide]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'ArrowLeft') prevSlide();
      else if (e.key === 'ArrowRight') nextSlide();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [nextSlide, prevSlide]);

  return (
    <div className="relative overflow-hidden w-full min-h-screen bg-[#F8FAFC] text-[#1E293B]">
      {/* Background Elements */}
      <div className="fixed inset-0 z-0">
        <div className="absolute inset-0 bg-[#F8FAFC]"></div>
        <div className="absolute inset-0 bg-grid-pattern opacity-[0.03]"></div>
      </div>

      <PublicHeader activePage="platform" />

      {/* Hero Section */}
      <section className="relative z-10 pt-40 pb-16 px-6 text-center">
        <div className="max-w-4xl mx-auto">
          <div className="inline-flex items-center gap-2 mb-6 px-4 py-2 rounded-full border border-primary-500/20 bg-gradient-to-r from-primary-500/5 to-primary-500/10 font-mono text-xs uppercase tracking-widest text-primary-500">
            <span className="w-2 h-2 rounded-full bg-cta-500 animate-pulse"></span>
            Platform Preview
          </div>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-black text-primary-500 mb-5 font-heading leading-tight">
            Your Compliance <span className="relative inline-block"><span className="text-primary-500">Command Center</span><span className="absolute bottom-2 left-0 right-0 h-3 bg-gradient-to-r from-cta-500/30 to-cta-500/10 rounded -z-10"></span></span>
          </h1>
          <p className="text-lg md:text-xl text-[#64748B] max-w-2xl mx-auto leading-relaxed">
            Everything you need to stay DOT-compliant in one powerful dashboard. Real-time monitoring, instant alerts, and AI-powered insights.
          </p>
        </div>
      </section>

      {/* Carousel Section */}
      <section className="relative z-10 px-6 pb-24">
        <div
          className="max-w-[1100px] mx-auto"
          onMouseEnter={() => setIsPaused(true)}
          onMouseLeave={() => setIsPaused(false)}
        >
          <div className="relative">
            <button
              onClick={prevSlide}
              className="hidden lg:flex absolute -left-20 top-1/2 -translate-y-1/2 w-14 h-14 bg-white border border-[#E2E8F0] rounded-full items-center justify-center cursor-pointer z-20 shadow-lg hover:bg-primary-500 hover:border-primary-500 hover:text-white transition-all hover:scale-105 group"
              aria-label="Previous slide"
            >
              <FiChevronLeft className="w-6 h-6 text-primary-500 group-hover:text-white" />
            </button>
            <button
              onClick={nextSlide}
              className="hidden lg:flex absolute -right-20 top-1/2 -translate-y-1/2 w-14 h-14 bg-white border border-[#E2E8F0] rounded-full items-center justify-center cursor-pointer z-20 shadow-lg hover:bg-primary-500 hover:border-primary-500 hover:text-white transition-all hover:scale-105 group"
              aria-label="Next slide"
            >
              <FiChevronRight className="w-6 h-6 text-primary-500 group-hover:text-white" />
            </button>

            {/* Laptop Frame */}
            <div className="relative perspective-[1500px]">
              <div className="relative bg-gradient-to-b from-[#2D2D2D] to-[#1A1A1A] rounded-t-[20px] p-4 pt-6 shadow-[-2px_-2px_20px_rgba(0,0,0,0.1)] before:content-[''] before:absolute before:top-2 before:left-1/2 before:-translate-x-1/2 before:w-2 before:h-2 before:bg-[#3D3D3D] before:rounded-full before:shadow-[inset_0_1px_2px_rgba(0,0,0,0.5)]">
                <div className="bg-[#0A0A0A] rounded-t-xl overflow-hidden">
                  <div className="relative aspect-[16/10] overflow-hidden">
                    <div className={`absolute inset-0 transition-all duration-600 ${currentSlide === 0 ? 'opacity-100 visible scale-100' : 'opacity-0 invisible scale-[0.98]'}`}>
                      <DashboardSlide />
                    </div>
                    <div className={`absolute inset-0 transition-all duration-600 ${currentSlide === 1 ? 'opacity-100 visible scale-100' : 'opacity-0 invisible scale-[0.98]'}`}>
                      <ComplianceSlide />
                    </div>
                    <div className={`absolute inset-0 transition-all duration-600 ${currentSlide === 2 ? 'opacity-100 visible scale-100' : 'opacity-0 invisible scale-[0.98]'}`}>
                      <DriversSlide />
                    </div>
                    <div className={`absolute inset-0 transition-all duration-600 ${currentSlide === 3 ? 'opacity-100 visible scale-100' : 'opacity-0 invisible scale-[0.98]'}`}>
                      <AlertsSlide />
                    </div>
                    <div className={`absolute inset-0 transition-all duration-600 ${currentSlide === 4 ? 'opacity-100 visible scale-100' : 'opacity-0 invisible scale-[0.98]'}`}>
                      <AIAssistantSlide />
                    </div>
                  </div>
                </div>
              </div>
              <div className="relative h-[18px] bg-gradient-to-b from-[#D4D4D4] via-[#A8A8A8] to-[#C0C0C0] rounded-b-xl mx-[-40px] shadow-[0_4px_8px_rgba(0,0,0,0.15),inset_0_2px_4px_rgba(255,255,255,0.5)] before:content-[''] before:absolute before:top-1/2 before:left-1/2 before:-translate-x-1/2 before:-translate-y-1/2 before:w-[120px] before:h-[6px] before:bg-gradient-to-b before:from-[#B0B0B0] before:to-[#909090] before:rounded-[3px] after:content-[''] after:absolute after:bottom-0 after:left-1/2 after:-translate-x-1/2 after:w-[calc(100%+80px)] after:h-1 after:bg-gradient-to-b after:from-[#8A8A8A] after:to-[#A0A0A0] after:rounded-b-[20px]"></div>
              <div className="absolute -bottom-[60px] left-1/2 -translate-x-1/2 w-[80%] h-10 bg-[radial-gradient(ellipse,rgba(0,0,0,0.2)_0%,transparent_70%)] blur-[10px]"></div>
            </div>
          </div>

          {/* Carousel Controls */}
          <div className="flex flex-col items-center gap-6 mt-12">
            <div className="text-xl font-bold text-primary-500 font-heading text-center transition-all duration-400">
              <span className="text-cta-500">{slideTitles[currentSlide].highlight}</span> — {slideTitles[currentSlide].text}
            </div>
            <div className="flex gap-3">
              {[0, 1, 2, 3, 4].map((index) => (
                <button
                  key={index}
                  onClick={() => goToSlide(index)}
                  className={`w-3 h-3 rounded-full transition-all duration-300 relative before:content-[''] before:absolute before:inset-[-4px] before:border-2 before:border-transparent before:rounded-full before:transition-all ${currentSlide === index ? 'bg-cta-500 scale-110 before:border-cta-500/30' : 'bg-[#E2E8F0] hover:bg-primary-300'}`}
                  aria-label={`Slide ${index + 1}`}
                />
              ))}
            </div>
            <div className="w-[200px] h-[3px] bg-[#E2E8F0] rounded overflow-hidden">
              <div className="h-full bg-gradient-to-r from-cta-500 to-cta-400 rounded transition-all duration-100" style={{ width: `${progress}%` }} />
            </div>
          </div>
        </div>
      </section>

      {/* Timeline Section - How It Works */}
      <TimelineSection />

      {/* CTA Section */}
      <section className="relative z-10 py-20 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-primary-500 mb-4 font-heading">Ready to Get Compliant?</h2>
          <p className="text-lg text-[#64748B] mb-8 max-w-2xl mx-auto">Get your compliance files organized in 5 minutes. Every document tracked, every expiration caught.</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/register" className="btn-glow px-8 py-4 rounded-xl font-bold text-white text-lg tracking-wide shadow-lg">Start Organizing My Files</Link>
            <a href="/#pricing" className="px-8 py-4 rounded-xl font-bold text-primary-500 text-lg border-2 border-primary-500/20 hover:border-primary-500 hover:bg-primary-500/5 transition-all">View Pricing</a>
          </div>
        </div>
      </section>

      <FooterSection />
    </div>
  );
};

// ============================================
// ACCURATE APP SIDEBAR (16 items, 4 sections)
// ============================================
const AppSidebar = ({ activeItem = 'dashboard' }) => {
  const menuItems = [
    // Main section
    { id: 'dashboard', icon: FiHome, label: 'Dashboard' },
    { id: 'ai', icon: FiMessageCircle, label: 'VroomX AI', badge: 'AI' },
    { id: 'alerts', icon: FiActivity, label: 'Alerts', alertCount: 3 },
    { id: 'tasks', icon: FiCheckSquare, label: 'Tasks' },
    // Management section
    { id: 'compliance', icon: FiBarChart2, label: 'Compliance', section: 'MANAGEMENT' },
    { id: 'drivers', icon: FiUsers, label: 'Driver Files' },
    { id: 'vehicles', icon: FiTruck, label: 'Vehicle Files' },
    { id: 'maintenance', icon: FiTool, label: 'Maintenance' },
    // Tracking section
    { id: 'violations', icon: FiAlertTriangle, label: 'Violations', section: 'TRACKING' },
    { id: 'tickets', icon: FiTag, label: 'Tickets' },
    { id: 'accidents', icon: FiAlertOctagon, label: 'Accidents' },
    { id: 'claims', icon: FiDollarSign, label: 'Damage Claims' },
    { id: 'drugalcohol', icon: FiDroplet, label: 'Drug & Alcohol' },
    // Tools section
    { id: 'documents', icon: FiFolder, label: 'Documents', section: 'TOOLS' },
    { id: 'checklists', icon: FiClipboard, label: 'Checklists' },
    { id: 'reports', icon: FiFileText, label: 'Reports' },
  ];

  return (
    <div className="w-[72px] bg-zinc-900 flex flex-col py-3 gap-0.5 flex-shrink-0 overflow-hidden">
      {menuItems.map((item, index) => {
        const Icon = item.icon;
        const isActive = item.id === activeItem;
        return (
          <div key={item.id} className="relative">
            {item.section && (
              <div className="px-2 py-1.5 mt-2 first:mt-0">
                <div className="h-px bg-white/10 mb-1"></div>
              </div>
            )}
            <div className={`mx-2 px-2 py-2 rounded-lg flex flex-col items-center gap-0.5 transition-all relative ${isActive ? 'bg-cta-500 text-white' : 'text-zinc-400 hover:bg-white/5'}`}>
              <Icon className="w-5 h-5" />
              <span className="text-[8px] font-medium truncate w-full text-center">{item.label.split(' ')[0]}</span>
              {item.badge && !isActive && (
                <span className="absolute top-1 right-1 px-1 py-0.5 bg-blue-500 text-white text-[6px] font-bold rounded">{item.badge}</span>
              )}
              {item.alertCount && !isActive && (
                <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white text-[8px] font-bold rounded-full flex items-center justify-center">{item.alertCount}</span>
              )}
              {isActive && <div className="absolute right-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-white rounded-l"></div>}
            </div>
          </div>
        );
      })}
    </div>
  );
};

// ============================================
// SLIDE 1: DASHBOARD
// ============================================
const DashboardSlide = () => (
  <div className="flex h-full bg-white">
    <AppSidebar activeItem="dashboard" />
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Top Header */}
      <div className="h-12 bg-white border-b border-zinc-200 flex items-center justify-between px-4">
        <div className="flex items-center gap-3">
          <span className="text-sm font-semibold text-zinc-800">Dashboard</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-zinc-100 flex items-center justify-center"><FiSearch className="w-3.5 h-3.5 text-zinc-500" /></div>
          <div className="w-7 h-7 rounded-full bg-gradient-to-br from-cta-500 to-cta-600 text-white text-[10px] font-bold flex items-center justify-center">JD</div>
        </div>
      </div>
      {/* Content */}
      <div className="flex-1 bg-zinc-50 p-4 overflow-hidden">
        <div className="flex gap-4 h-full">
          {/* Left: Score Gauge */}
          <div className="w-[180px] bg-white rounded-xl p-4 border border-zinc-200 flex flex-col items-center">
            <span className="text-[9px] text-zinc-500 uppercase tracking-wider mb-2">Compliance Score</span>
            <div className="relative w-[100px] h-[100px]">
              <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="40" fill="none" stroke="#E2E8F0" strokeWidth="8" />
                <circle cx="50" cy="50" r="40" fill="none" stroke="#22C55E" strokeWidth="8" strokeDasharray="251" strokeDashoffset="38" strokeLinecap="round" />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-2xl font-bold text-zinc-800">87</span>
                <span className="text-[8px] text-zinc-500">Score</span>
              </div>
            </div>
            <div className="mt-2 px-2 py-1 bg-green-50 text-green-600 rounded-full text-[9px] font-medium">✓ Good Standing</div>
            {/* Score Factors */}
            <div className="grid grid-cols-2 gap-2 mt-3 w-full">
              {[{ label: 'DQF', value: '95%', color: 'green' }, { label: 'Vehicles', value: '88%', color: 'green' }, { label: 'Violations', value: '72%', color: 'yellow' }, { label: 'D&A', value: '100%', color: 'green' }].map((f, i) => (
                <div key={i} className="text-center">
                  <div className={`text-[10px] font-bold ${f.color === 'green' ? 'text-green-600' : 'text-yellow-600'}`}>{f.value}</div>
                  <div className="text-[7px] text-zinc-400">{f.label}</div>
                </div>
              ))}
            </div>
          </div>
          {/* Right Content */}
          <div className="flex-1 flex flex-col gap-3 overflow-hidden">
            {/* Quick Stats */}
            <div className="grid grid-cols-4 gap-2">
              <QuickStat icon={FiUsers} label="Active Drivers" value="24" color="blue" />
              <QuickStat icon={FiTruck} label="Fleet Vehicles" value="18" color="purple" />
              <QuickStat icon={FiClock} label="Expiring Docs" value="3" color="yellow" />
              <QuickStat icon={FiAlertTriangle} label="Open Violations" value="2" color="red" />
            </div>
            {/* BASICs Overview */}
            <div className="bg-white rounded-xl border border-zinc-200 p-3 flex-1">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <FiShield className="w-4 h-4 text-primary-500" />
                  <span className="text-[10px] font-semibold text-zinc-800">SMS BASICs Overview</span>
                </div>
                <span className="text-[8px] px-1.5 py-0.5 bg-green-50 text-green-600 rounded">↑ Improving</span>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <BasicBox name="Unsafe Driving" percent={32} status="good" />
                <BasicBox name="HOS Compliance" percent={58} status="warning" />
                <BasicBox name="Vehicle Maint." percent={45} status="good" />
                <BasicBox name="Controlled Sub." percent={12} status="good" />
                <BasicBox name="Driver Fitness" percent={28} status="good" />
                <BasicBox name="Crash Indicator" percent={72} status="critical" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
);

const QuickStat = ({ icon: Icon, label, value, color }) => {
  const colors = { blue: 'bg-blue-50 text-blue-600', purple: 'bg-purple-50 text-purple-600', yellow: 'bg-yellow-50 text-yellow-600', red: 'bg-red-50 text-red-600' };
  return (
    <div className="bg-white rounded-lg border border-zinc-200 p-2">
      <div className="flex items-center justify-between mb-1">
        <span className="text-[8px] text-zinc-500">{label}</span>
        <div className={`w-5 h-5 rounded flex items-center justify-center ${colors[color]}`}><Icon className="w-3 h-3" /></div>
      </div>
      <div className="text-lg font-bold text-zinc-800">{value}</div>
    </div>
  );
};

const BasicBox = ({ name, percent, status }) => {
  const statusColors = { good: 'bg-green-500', warning: 'bg-yellow-500', critical: 'bg-red-500' };
  const bgColors = { good: 'bg-green-50', warning: 'bg-yellow-50', critical: 'bg-red-50' };
  return (
    <div className={`${bgColors[status]} rounded-lg p-2 text-center`}>
      <div className={`text-sm font-bold ${status === 'good' ? 'text-green-700' : status === 'warning' ? 'text-yellow-700' : 'text-red-700'}`}>{percent}%</div>
      <div className="text-[7px] text-zinc-600 truncate">{name}</div>
    </div>
  );
};

// ============================================
// SLIDE 2: COMPLIANCE
// ============================================
const ComplianceSlide = () => (
  <div className="flex h-full bg-white">
    <AppSidebar activeItem="compliance" />
    <div className="flex-1 flex flex-col overflow-hidden">
      <div className="h-12 bg-white border-b border-zinc-200 flex items-center justify-between px-4">
        <span className="text-sm font-semibold text-zinc-800">Compliance Dashboard</span>
        <button className="px-2 py-1 bg-cta-500 text-white rounded text-[9px] font-medium flex items-center gap-1">
          <FiRefreshCw className="w-3 h-3" /> Update BASICs
        </button>
      </div>
      <div className="flex-1 bg-zinc-50 p-4 overflow-hidden">
        {/* Tabs */}
        <div className="flex gap-1 mb-3">
          <div className="px-3 py-1.5 bg-cta-500 text-white rounded-lg text-[9px] font-medium">SMS BASICs Overview</div>
          <div className="px-3 py-1.5 bg-white text-zinc-600 rounded-lg text-[9px] font-medium border border-zinc-200">Score Trends</div>
          <div className="px-3 py-1.5 bg-white text-zinc-600 rounded-lg text-[9px] font-medium border border-zinc-200 flex items-center gap-1">CSA Estimator <span className="px-1 py-0.5 bg-blue-100 text-blue-600 text-[7px] rounded">BETA</span></div>
        </div>
        <div className="flex gap-3 h-[calc(100%-40px)]">
          {/* Left: Bar Chart */}
          <div className="flex-1 bg-white rounded-xl border border-zinc-200 p-3">
            <div className="text-[10px] font-semibold text-zinc-700 mb-3">BASIC Percentiles</div>
            <div className="space-y-2">
              {[
                { name: 'Unsafe Driving', percent: 32, threshold: 65 },
                { name: 'HOS Compliance', percent: 58, threshold: 65 },
                { name: 'Vehicle Maint.', percent: 45, threshold: 80 },
                { name: 'Controlled Sub.', percent: 12, threshold: 80 },
                { name: 'Driver Fitness', percent: 28, threshold: 80 },
                { name: 'Crash Indicator', percent: 72, threshold: 65 },
              ].map((b, i) => (
                <div key={i} className="flex items-center gap-2">
                  <span className="text-[8px] text-zinc-600 w-20 truncate">{b.name}</span>
                  <div className="flex-1 h-3 bg-zinc-100 rounded-full overflow-hidden relative">
                    <div className={`h-full rounded-full ${b.percent > b.threshold ? 'bg-red-500' : b.percent > b.threshold - 15 ? 'bg-yellow-500' : 'bg-green-500'}`} style={{ width: `${b.percent}%` }}></div>
                    <div className="absolute top-0 h-full w-px bg-zinc-400" style={{ left: `${b.threshold}%` }}></div>
                  </div>
                  <span className="text-[9px] font-semibold text-zinc-700 w-8">{b.percent}%</span>
                </div>
              ))}
            </div>
          </div>
          {/* Right: Cards Grid */}
          <div className="w-[200px] flex flex-col gap-2">
            <div className="grid grid-cols-2 gap-2 flex-1">
              {[
                { name: 'Unsafe', percent: 32, status: 'good' },
                { name: 'HOS', percent: 58, status: 'warning' },
                { name: 'Vehicle', percent: 45, status: 'good' },
                { name: 'Drugs', percent: 12, status: 'good' },
                { name: 'Fitness', percent: 28, status: 'good' },
                { name: 'Crash', percent: 72, status: 'critical' },
              ].map((b, i) => (
                <div key={i} className={`rounded-lg p-2 border-l-2 bg-white ${b.status === 'good' ? 'border-green-500' : b.status === 'warning' ? 'border-yellow-500' : 'border-red-500'}`}>
                  <div className={`text-lg font-bold ${b.status === 'good' ? 'text-green-600' : b.status === 'warning' ? 'text-yellow-600' : 'text-red-600'}`}>{b.percent}%</div>
                  <div className="text-[7px] text-zinc-500">{b.name}</div>
                </div>
              ))}
            </div>
            {/* Audit Ready */}
            <div className="bg-white rounded-lg border border-zinc-200 p-2">
              <div className="text-[9px] font-semibold text-zinc-700 mb-1">Audit Readiness</div>
              <div className="flex items-center gap-1 text-[8px] text-green-600"><span>✓</span> DQF Files Complete</div>
              <div className="flex items-center gap-1 text-[8px] text-green-600"><span>✓</span> Vehicle Records OK</div>
              <div className="flex items-center gap-1 text-[8px] text-green-600"><span>✓</span> D&A Program OK</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
);

// ============================================
// SLIDE 3: DRIVER FILES
// ============================================
const DriversSlide = () => (
  <div className="flex h-full bg-white">
    <AppSidebar activeItem="drivers" />
    <div className="flex-1 flex flex-col overflow-hidden">
      <div className="h-12 bg-white border-b border-zinc-200 flex items-center justify-between px-4">
        <span className="text-sm font-semibold text-zinc-800">Driver Qualification Files</span>
        <button className="px-2 py-1 bg-cta-500 text-white rounded text-[9px] font-medium">+ Add Driver</button>
      </div>
      <div className="flex-1 bg-zinc-50 p-4 overflow-hidden flex flex-col">
        {/* Search & Filters */}
        <div className="flex gap-2 mb-3">
          <div className="flex-1 flex items-center gap-2 px-2 py-1.5 bg-white border border-zinc-200 rounded-lg">
            <FiSearch className="w-3.5 h-3.5 text-zinc-400" />
            <span className="text-[9px] text-zinc-400">Search drivers...</span>
          </div>
          <div className="flex items-center gap-1 px-2 py-1.5 bg-white border border-zinc-200 rounded-lg text-[9px] text-zinc-600">
            <FiFilter className="w-3 h-3" /> Status
          </div>
          <div className="flex items-center gap-1 px-2 py-1.5 bg-white border border-zinc-200 rounded-lg text-[9px] text-zinc-600">
            <FiFilter className="w-3 h-3" /> Compliance
          </div>
        </div>
        {/* Table */}
        <div className="flex-1 bg-white rounded-xl border border-zinc-200 overflow-hidden">
          <div className="grid grid-cols-[2fr_1.5fr_1fr_1fr_1fr_0.5fr] px-3 py-2 bg-zinc-50 text-[8px] font-semibold text-zinc-500 uppercase tracking-wider border-b border-zinc-200">
            <span>Driver</span>
            <span>CDL Info</span>
            <span>CDL Expiry</span>
            <span>Med Card</span>
            <span>Status</span>
            <span></span>
          </div>
          <DriverTableRow name="John Davis" id="EMP-001" initials="JD" cdl="PA-12345678 • Class A" cdlExpiry="Mar 15, 2026" cdlDays="245" medExpiry="Jun 20, 2025" medDays="90" status="Compliant" />
          <DriverTableRow name="Maria Santos" id="EMP-002" initials="MS" cdl="TX-98765432 • Class A" cdlExpiry="Feb 23, 2025" cdlDays="28" medExpiry="Apr 15, 2025" medDays="54" status="Warning" />
          <DriverTableRow name="Robert Johnson" id="EMP-003" initials="RJ" cdl="OH-55443322 • Class B" cdlExpiry="Jan 15, 2025" cdlDays="-10" medExpiry="Dec 01, 2024" medDays="-55" status="Non-Compliant" />
          <DriverTableRow name="Sarah Williams" id="EMP-004" initials="SW" cdl="CA-11223344 • Class A" cdlExpiry="Jul 28, 2025" cdlDays="180" medExpiry="Sep 10, 2025" medDays="224" status="Compliant" />
        </div>
      </div>
    </div>
  </div>
);

const DriverTableRow = ({ name, id, initials, cdl, cdlExpiry, cdlDays, medExpiry, medDays, status }) => {
  const statusColors = { Compliant: 'bg-green-50 text-green-700', Warning: 'bg-yellow-50 text-yellow-700', 'Non-Compliant': 'bg-red-50 text-red-700' };
  const daysColor = (d) => parseInt(d) < 0 ? 'text-red-500' : parseInt(d) < 30 ? 'text-yellow-600' : 'text-green-600';
  return (
    <div className="grid grid-cols-[2fr_1.5fr_1fr_1fr_1fr_0.5fr] px-3 py-2 items-center border-b border-zinc-100 text-[9px]">
      <div className="flex items-center gap-2">
        <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-primary-500 to-primary-600 text-white flex items-center justify-center text-[9px] font-semibold">{initials}</div>
        <div>
          <div className="font-semibold text-zinc-800">{name}</div>
          <div className="text-[8px] text-zinc-400">{id}</div>
        </div>
      </div>
      <span className="text-zinc-600">{cdl}</span>
      <div>
        <div className="text-zinc-700">{cdlExpiry}</div>
        <div className={`text-[8px] ${daysColor(cdlDays)}`}>{parseInt(cdlDays) < 0 ? 'Expired' : `${cdlDays} days`}</div>
      </div>
      <div>
        <div className="text-zinc-700">{medExpiry}</div>
        <div className={`text-[8px] ${daysColor(medDays)}`}>{parseInt(medDays) < 0 ? 'Expired' : `${medDays} days`}</div>
      </div>
      <span className={`px-2 py-0.5 rounded-full text-[8px] font-medium ${statusColors[status]}`}>{status}</span>
      <FiMoreVertical className="w-3.5 h-3.5 text-zinc-400" />
    </div>
  );
};

// ============================================
// SLIDE 4: ALERTS DASHBOARD
// ============================================
const AlertsSlide = () => (
  <div className="flex h-full bg-white">
    <AppSidebar activeItem="alerts" />
    <div className="flex-1 flex flex-col overflow-hidden">
      <div className="h-12 bg-white border-b border-zinc-200 flex items-center justify-between px-4">
        <span className="text-sm font-semibold text-zinc-800">Alerts Dashboard</span>
        <div className="flex gap-2">
          <button className="px-2 py-1 bg-zinc-100 text-zinc-600 rounded text-[9px] font-medium flex items-center gap-1"><FiEye className="w-3 h-3" /> Show Dismissed</button>
          <button className="px-2 py-1 bg-zinc-100 text-zinc-600 rounded text-[9px] font-medium flex items-center gap-1"><FiRefreshCw className="w-3 h-3" /> Refresh</button>
        </div>
      </div>
      <div className="flex-1 bg-zinc-50 p-4 overflow-hidden flex flex-col">
        {/* Score + Stats Row */}
        <div className="flex gap-3 mb-3">
          {/* Score Gauge */}
          <div className="w-[100px] bg-white rounded-xl border border-zinc-200 p-3 flex flex-col items-center">
            <div className="relative w-[60px] h-[60px]">
              <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="40" fill="none" stroke="#E2E8F0" strokeWidth="10" />
                <circle cx="50" cy="50" r="40" fill="none" stroke="#22C55E" strokeWidth="10" strokeDasharray="251" strokeDashoffset="38" strokeLinecap="round" />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-lg font-bold text-zinc-800">87</span>
              </div>
            </div>
            <span className="text-[8px] text-zinc-500 mt-1">VroomX Score</span>
          </div>
          {/* Alert Counts */}
          <div className="flex-1 grid grid-cols-3 gap-2">
            <AlertCountCard type="critical" count={3} />
            <AlertCountCard type="warning" count={7} />
            <AlertCountCard type="info" count={12} />
          </div>
        </div>
        {/* Alert Lists */}
        <div className="flex-1 grid grid-cols-3 gap-3 overflow-hidden">
          <AlertColumn type="critical" title="Critical" alerts={[
            { title: 'Medical Card Expired', desc: 'Robert Johnson', time: '5 days ago' },
            { title: 'BASIC Over Threshold', desc: 'Crash Indicator at 72%', time: '2 days ago' },
          ]} />
          <AlertColumn type="warning" title="Warning" alerts={[
            { title: 'CDL Expiring Soon', desc: 'Maria Santos - 28 days', time: '1 day ago' },
            { title: 'Annual Inspection Due', desc: 'Vehicle #105', time: '3 days ago' },
            { title: 'MVR Review Needed', desc: '2 drivers pending', time: '1 week ago' },
          ]} />
          <AlertColumn type="info" title="Info" alerts={[
            { title: 'New Driver Added', desc: 'Sarah Williams onboarded', time: '2 hours ago' },
            { title: 'FMCSA Data Synced', desc: 'BASICs updated from SAFER', time: '4 hours ago' },
          ]} />
        </div>
      </div>
    </div>
  </div>
);

const AlertCountCard = ({ type, count }) => {
  const config = { critical: { bg: 'bg-red-50', border: 'border-red-200', text: 'text-red-700', icon: '🚨' }, warning: { bg: 'bg-yellow-50', border: 'border-yellow-200', text: 'text-yellow-700', icon: '⚠️' }, info: { bg: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-700', icon: 'ℹ️' } };
  const c = config[type];
  return (
    <div className={`${c.bg} border ${c.border} rounded-xl p-3 flex items-center gap-2`}>
      <span className="text-xl">{c.icon}</span>
      <div>
        <div className={`text-2xl font-bold ${c.text}`}>{count}</div>
        <div className="text-[8px] text-zinc-500 capitalize">{type}</div>
      </div>
    </div>
  );
};

const AlertColumn = ({ type, title, alerts }) => {
  const headerColors = { critical: 'bg-red-500', warning: 'bg-yellow-500', info: 'bg-blue-500' };
  return (
    <div className="bg-white rounded-xl border border-zinc-200 overflow-hidden flex flex-col">
      <div className={`${headerColors[type]} px-3 py-1.5 text-white text-[10px] font-semibold flex items-center gap-1.5`}>
        <span className="w-2 h-2 bg-white/50 rounded-full"></span> {title} ({alerts.length})
      </div>
      <div className="flex-1 p-2 space-y-1.5 overflow-auto">
        {alerts.map((a, i) => (
          <div key={i} className="bg-zinc-50 rounded-lg p-2">
            <div className="text-[9px] font-semibold text-zinc-800">{a.title}</div>
            <div className="text-[8px] text-zinc-500">{a.desc}</div>
            <div className="text-[7px] text-zinc-400 mt-1">{a.time}</div>
          </div>
        ))}
      </div>
    </div>
  );
};

// ============================================
// SLIDE 5: AI ASSISTANT
// ============================================
const AIAssistantSlide = () => (
  <div className="flex h-full bg-white">
    <AppSidebar activeItem="ai" />
    <div className="flex-1 flex flex-col overflow-hidden">
      <div className="h-12 bg-white border-b border-zinc-200 flex items-center justify-between px-4">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-zinc-800">VroomX AI Assistant</span>
          <span className="px-1.5 py-0.5 bg-gradient-to-r from-indigo-500 to-purple-500 text-white text-[8px] font-semibold rounded">AI-Powered</span>
        </div>
      </div>
      <div className="flex-1 bg-zinc-50 p-4 overflow-hidden">
        <div className="grid grid-cols-3 gap-2 mb-3">
          <TopicCard icon={FiUsers} title="Driver Qualifications" cfr="49 CFR Part 391" />
          <TopicCard icon={FiDroplet} title="Drug & Alcohol Testing" cfr="49 CFR Part 382" />
          <TopicCard icon={FiClock} title="Hours of Service" cfr="49 CFR Part 395" />
          <TopicCard icon={FiTruck} title="Vehicle Maintenance" cfr="49 CFR Part 396" />
          <TopicCard icon={FiShield} title="CSA & SMS Scoring" cfr="Safety Measurement" />
          <TopicCard icon={FiHelpCircle} title="General Compliance" cfr="FMCSA Regulations" />
        </div>
        {/* Chat Preview */}
        <div className="bg-white rounded-xl border border-zinc-200 p-3 h-[calc(100%-130px)]">
          <div className="space-y-2 mb-3">
            <div className="flex justify-end">
              <div className="bg-cta-500 text-white px-3 py-1.5 rounded-xl rounded-br-sm text-[9px] max-w-[70%]">What are the DQF requirements for new drivers?</div>
            </div>
            <div className="flex justify-start">
              <div className="bg-zinc-100 text-zinc-800 px-3 py-2 rounded-xl rounded-bl-sm text-[9px] max-w-[80%]">
                <p className="mb-1">Under 49 CFR Part 391, new drivers must have:</p>
                <ul className="list-disc list-inside text-[8px] space-y-0.5 text-zinc-600">
                  <li>Valid CDL with proper endorsements</li>
                  <li>Current medical examiner's certificate</li>
                  <li>Motor Vehicle Record (MVR) review</li>
                  <li>Road test or equivalent certificate</li>
                </ul>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2 bg-zinc-50 rounded-lg px-3 py-2 border border-zinc-200">
            <span className="text-[9px] text-zinc-400 flex-1">Ask about FMCSA regulations...</span>
            <div className="w-6 h-6 bg-cta-500 rounded-lg flex items-center justify-center text-white"><FiMessageCircle className="w-3 h-3" /></div>
          </div>
        </div>
      </div>
    </div>
  </div>
);

const TopicCard = ({ icon: Icon, title, cfr }) => (
  <div className="bg-white rounded-lg border border-zinc-200 p-2 hover:border-cta-500/50 transition-colors cursor-pointer">
    <div className="flex items-start gap-2">
      <div className="w-7 h-7 rounded-lg bg-primary-50 text-primary-500 flex items-center justify-center flex-shrink-0">
        <Icon className="w-3.5 h-3.5" />
      </div>
      <div>
        <div className="text-[9px] font-semibold text-zinc-800">{title}</div>
        <div className="text-[7px] text-zinc-400">{cfr}</div>
      </div>
    </div>
  </div>
);

// ============================================
// TIMELINE SECTION - "How It Works"
// ============================================
import { FiFolderPlus, FiTrendingUp, FiBell, FiMessageSquare, FiFilePlus, FiCheck, FiArrowRight, FiCalendar, FiMail, FiRefreshCw as FiRefresh, FiBook, FiSearch as FiSearchIcon, FiAward, FiTarget } from 'react-icons/fi';

const TimelineSection = () => {
  const [visibleItems, setVisibleItems] = useState(new Set());
  const [scrollProgress, setScrollProgress] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      const timeline = document.getElementById('timeline-container');
      if (!timeline) return;

      const rect = timeline.getBoundingClientRect();
      const windowHeight = window.innerHeight;
      const progress = Math.min(100, Math.max(0,
        ((windowHeight - rect.top) / (rect.height + windowHeight - 200)) * 100
      ));
      setScrollProgress(progress);
    };

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const step = entry.target.dataset.step;
            if (step) {
              setVisibleItems(prev => new Set([...prev, step]));
            }
          }
        });
      },
      { threshold: 0.2, rootMargin: '0px 0px -50px 0px' }
    );

    document.querySelectorAll('.timeline-item').forEach(item => {
      observer.observe(item);
    });

    window.addEventListener('scroll', handleScroll);
    handleScroll();

    return () => {
      observer.disconnect();
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  const timelineSteps = [
    {
      step: 1,
      icon: FiFolderPlus,
      title: 'Organize Your DQF Files',
      description: 'Upload and organize all your Driver Qualification Files in one secure location. We support all document types and automatically track expiration dates.',
      features: [
        { icon: FiUsers, text: 'CDL & medical cards' },
        { icon: FiFileText, text: 'MVR tracking' },
        { icon: FiClipboard, text: 'Annual inspections' },
        { icon: FiFolder, text: 'Secure cloud storage' },
      ],
      isAI: false,
      preview: 'dqf',
    },
    {
      step: 2,
      icon: FiBarChart2,
      title: 'Monitor Your CSA Score',
      description: 'Get a complete picture of your safety scores across all 7 BASICs. Track trends over time and understand what\'s affecting your numbers.',
      features: [
        { icon: FiShield, text: 'All 7 BASICs tracked' },
        { icon: FiTrendingUp, text: 'Historical trends' },
        { icon: FiUsers, text: 'Peer comparisons' },
        { icon: FiTarget, text: 'Score projections' },
      ],
      isAI: false,
      preview: 'csa',
    },
    {
      step: 3,
      icon: FiBell,
      title: 'Stay Ahead with Smart Alerts',
      description: 'Automated reminders ensure you never miss an expiring document or compliance deadline. Get notified via email, SMS, or push.',
      features: [
        { icon: FiCalendar, text: '30, 14, 7 day warnings' },
        { icon: FiMail, text: 'Email & SMS alerts' },
        { icon: FiActivity, text: 'CSA score changes' },
        { icon: FiTool, text: 'Custom schedules' },
      ],
      isAI: false,
      preview: 'alerts',
    },
    {
      step: 4,
      icon: FiMessageSquare,
      title: 'Get AI-Powered Help',
      description: 'Ask any FMCSA regulation question and get instant, accurate answers. Our AI is trained on the complete FMCSR and stays up-to-date with the latest changes.',
      features: [
        { icon: FiClock, text: '24/7 availability' },
        { icon: FiMessageCircle, text: 'Plain English answers' },
        { icon: FiRefresh, text: 'Always up-to-date' },
        { icon: FiBook, text: 'Cite specific regulations' },
      ],
      isAI: true,
      preview: 'chat',
    },
    {
      step: 5,
      icon: FiFilePlus,
      title: 'Challenge Unfair Violations',
      description: 'Our AI scans your violation history to identify challengeable items and generates professional DataQ letters automatically.',
      features: [
        { icon: FiSearchIcon, text: 'Auto-detect opportunities' },
        { icon: FiFileText, text: 'Generate DataQ letters' },
        { icon: FiActivity, text: 'Track challenge status' },
        { icon: FiAward, text: '40% avg success rate' },
      ],
      isAI: true,
      preview: 'dataq',
    },
  ];

  return (
    <section className="relative z-10 py-24 px-6">
      <div className="max-w-[1000px] mx-auto">
        {/* Section Header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 mb-5 px-4 py-2 rounded-full border border-green-500/20 bg-gradient-to-r from-green-500/5 to-green-500/10 font-mono text-xs uppercase tracking-widest text-green-600">
            <FiCheck className="w-4 h-4" />
            How It Works
          </div>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-black text-primary-500 mb-4 font-heading">
            Your Path to <span className="text-cta-500">Full Compliance</span>
          </h2>
          <p className="text-lg text-[#64748B] max-w-xl mx-auto">
            VroomX guides you through every step of FMCSA compliance, from document management to score optimization.
          </p>
        </div>

        {/* Timeline */}
        <div id="timeline-container" className="relative pl-20 md:pl-28">
          {/* Progress Line */}
          <div className="absolute left-8 md:left-12 top-0 bottom-0 w-1.5 bg-[#E2E8F0] rounded-full overflow-hidden">
            <div
              className="w-full bg-gradient-to-b from-primary-500 via-indigo-500 to-green-500 rounded-full transition-all duration-300"
              style={{ height: `${scrollProgress}%` }}
            />
          </div>

          {/* Timeline Items */}
          {timelineSteps.map((item) => (
            <TimelineItem
              key={item.step}
              {...item}
              isVisible={visibleItems.has(String(item.step))}
            />
          ))}

          {/* Success Card */}
          <div
            className={`timeline-item relative mt-16 transition-all duration-700 ${visibleItems.has('success') ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
            data-step="success"
          >
            <div className="bg-green-50 rounded-3xl p-10 text-center relative overflow-hidden border border-green-200">

              <div className="relative z-10">
                <div className="w-20 h-20 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl mx-auto mb-6 flex items-center justify-center shadow-lg shadow-green-500/30 animate-float">
                  <FiShield className="w-10 h-10 text-white" />
                </div>
                <h3 className="text-2xl md:text-3xl font-bold text-green-800 mb-3">Stay Compliant, Stress-Free</h3>
                <p className="text-green-700 mb-8 max-w-md mx-auto">
                  Pass any DOT audit with confidence. Focus on driving while VroomX handles your compliance.
                </p>
                <Link
                  to="/register"
                  className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-cta-500 to-cta-600 text-white rounded-xl font-bold text-lg shadow-lg shadow-cta-500/30 hover:shadow-xl hover:shadow-cta-500/40 hover:-translate-y-1 transition-all"
                >
                  Get Audit-Ready Now
                  <FiArrowRight className="w-5 h-5" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

const TimelineItem = ({ step, icon: Icon, title, description, features, isAI, preview, isVisible }) => (
  <div
    className={`timeline-item relative mb-12 transition-all duration-700 ${isVisible ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-8'}`}
    data-step={step}
    style={{ transitionDelay: `${step * 100}ms` }}
  >
    {/* Marker */}
    <div className={`absolute -left-12 md:-left-16 top-0 w-14 h-14 md:w-16 md:h-16 rounded-2xl flex items-center justify-center shadow-lg transition-all duration-500 ${
      isAI
        ? 'bg-gradient-to-br from-indigo-500 to-purple-600 shadow-indigo-500/30'
        : 'bg-white border-4 border-primary-500 shadow-primary-500/20'
    } ${isVisible ? 'scale-100 rotate-0' : 'scale-75 rotate-12'}`}>
      <Icon className={`w-6 h-6 md:w-7 md:h-7 ${isAI ? 'text-white' : 'text-primary-500'}`} />
    </div>

    {/* Step Number */}
    <div className="absolute -left-20 md:-left-24 top-16 text-[10px] font-bold text-[#94A3B8] uppercase tracking-widest" style={{ writingMode: 'vertical-rl', textOrientation: 'mixed', transform: 'rotate(180deg)' }}>
      Step {String(step).padStart(2, '0')}
    </div>

    {/* Card */}
    <div className={`bg-white rounded-2xl p-6 md:p-8 shadow-lg border border-[#E2E8F0] transition-all duration-500 hover:shadow-xl hover:translate-x-2 relative overflow-hidden ${
      isVisible ? 'before:scale-x-100' : 'before:scale-x-0'
    } before:content-[''] before:absolute before:top-0 before:left-0 before:w-full before:h-1 before:origin-left before:transition-transform before:duration-500 ${
      isAI ? 'before:bg-gradient-to-r before:from-indigo-500 before:to-purple-600' : 'before:bg-gradient-to-r before:from-primary-500 before:to-primary-400'
    }`}>
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <h3 className="text-xl md:text-2xl font-bold text-[#1E293B]">{title}</h3>
        {isAI && (
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-indigo-500 to-purple-600 text-white text-xs font-bold rounded-lg">
            <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2L9 9l-7 3 7 3 3 7 3-7 7-3-7-3-3-7z"/>
            </svg>
            AI-POWERED
          </span>
        )}
      </div>

      <p className="text-[#64748B] mb-6 leading-relaxed">{description}</p>

      {/* Features Grid */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        {features.map((feature, idx) => (
          <div
            key={idx}
            className="flex items-center gap-3 px-4 py-3 bg-[#F8FAFC] rounded-xl hover:bg-green-50 hover:translate-x-1 transition-all group"
          >
            <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center text-green-600 group-hover:bg-green-200 transition-colors">
              <feature.icon className="w-4 h-4" />
            </div>
            <span className="text-sm text-[#475569]">{feature.text}</span>
          </div>
        ))}
      </div>

      {/* Preview (placeholder for screenshots) */}
      {preview === 'csa' && (
        <div className={`mt-6 p-4 rounded-xl ${isAI ? 'bg-indigo-50' : 'bg-[#F8FAFC]'}`}>
          <div className="space-y-3">
            {[
              { name: 'Unsafe Driving', percent: 32, color: 'green' },
              { name: 'HOS Compliance', percent: 45, color: 'green' },
              { name: 'Vehicle Maint.', percent: 58, color: 'yellow' },
            ].map((basic, idx) => (
              <div key={idx} className="flex items-center gap-3">
                <span className="text-xs text-[#94A3B8] w-24">{basic.name}</span>
                <div className="flex-1 h-2.5 bg-white rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-1000 ${basic.color === 'green' ? 'bg-green-500' : 'bg-yellow-500'}`}
                    style={{ width: isVisible ? `${basic.percent}%` : '0%' }}
                  />
                </div>
                <span className="text-xs font-semibold text-[#475569] w-10 text-right">{basic.percent}%</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {preview === 'chat' && (
        <div className="mt-6 p-4 rounded-xl bg-indigo-50">
          <div className="space-y-3">
            <div className="flex gap-3 items-start">
              <div className="w-8 h-8 rounded-lg bg-[#E2E8F0] flex items-center justify-center text-[#94A3B8]">
                <FiUsers className="w-4 h-4" />
              </div>
              <div className="bg-white px-4 py-2.5 rounded-xl rounded-tl-sm text-sm text-[#475569] max-w-[80%]">
                What's the HOS limit for property-carrying drivers?
              </div>
            </div>
            <div className="flex gap-3 items-start">
              <div className="w-8 h-8 rounded-lg bg-indigo-500 flex items-center justify-center text-white">
                <FiMessageSquare className="w-4 h-4" />
              </div>
              <div className="bg-white px-4 py-2.5 rounded-xl rounded-tl-sm text-sm text-[#475569] max-w-[80%]">
                Property-carrying drivers have an <strong>11-hour driving limit</strong> after 10 consecutive hours off duty, per §395.3...
              </div>
            </div>
          </div>
        </div>
      )}

      {/* DQF Files Preview */}
      {preview === 'dqf' && (
        <div className="mt-6 p-4 rounded-xl bg-[#F8FAFC]">
          <div className="grid grid-cols-2 gap-3">
            {[
              { icon: FiFileText, status: 'valid', badge: '✓ Valid', name: 'CDL License', detail: 'Class A \u2022 PA-12345678', expiry: 'Expires Mar 15, 2026', remaining: '245 days remaining', borderColor: 'border-success-200', badgeBg: 'bg-success-100', badgeText: 'text-success-700', iconBg: 'bg-success-50', iconText: 'text-success-600', expiryText: 'text-success-600' },
              { icon: FiClipboard, status: 'warning', badge: '\u26A0 Expiring', name: 'Medical Card', detail: 'DOT Physical Exam', expiry: 'Expires Feb 23, 2025', remaining: '28 days remaining', borderColor: 'border-warning-200', badgeBg: 'bg-warning-100', badgeText: 'text-warning-700', iconBg: 'bg-warning-50', iconText: 'text-warning-600', expiryText: 'text-warning-600' },
              { icon: FiSearch, status: 'valid', badge: '✓ Valid', name: 'MVR Report', detail: 'Motor Vehicle Record', expiry: 'Reviewed Oct 2024', remaining: 'Annual review current', borderColor: 'border-success-200', badgeBg: 'bg-success-100', badgeText: 'text-success-700', iconBg: 'bg-success-50', iconText: 'text-success-600', expiryText: 'text-success-600' },
              { icon: FiAlertTriangle, status: 'expired', badge: '\u2717 Expired', name: 'Road Test Cert.', detail: '49 CFR 391.31', expiry: 'Expired Dec 1, 2024', remaining: '10 days overdue', borderColor: 'border-danger-200', badgeBg: 'bg-danger-100', badgeText: 'text-danger-700', iconBg: 'bg-danger-50', iconText: 'text-danger-600', expiryText: 'text-danger-600' },
            ].map((doc, idx) => (
              <div
                key={idx}
                className={`bg-white rounded-lg border-2 ${doc.borderColor} p-3 transition-all duration-700 ${isVisible ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}`}
                style={{ transitionDelay: `${idx * 150}ms` }}
              >
                <div className="flex items-start justify-between mb-2">
                  <div className={`w-9 h-9 rounded-lg ${doc.iconBg} ${doc.iconText} flex items-center justify-center`}>
                    <doc.icon className="w-4 h-4" />
                  </div>
                  <span className={`px-2 py-0.5 ${doc.badgeBg} ${doc.badgeText} rounded-full text-[8px] font-semibold`}>{doc.badge}</span>
                </div>
                <div className="text-xs font-semibold text-zinc-800 mb-0.5">{doc.name}</div>
                <div className="text-[10px] text-zinc-500">{doc.detail}</div>
                <div className={`text-[9px] ${doc.expiryText} mt-2 font-medium`}>{doc.expiry}</div>
                <div className="text-[8px] text-zinc-400">{doc.remaining}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Smart Alerts Preview */}
      {preview === 'alerts' && (
        <div className="mt-6 p-4 rounded-xl bg-[#F8FAFC]">
          <div className="space-y-2.5">
            {[
              { severity: 'critical', borderColor: 'border-danger-500', iconBg: 'bg-danger-50', iconText: 'text-danger-600', badgeBg: 'bg-danger-100', badgeText: 'text-danger-700', icon: FiAlertTriangle, title: 'Medical Card Expired', desc: 'Robert Johnson \u2022 EMP-003', timeIcon: FiClock, timeText: 'Expired 5 days ago', timeColor: 'text-danger-600', extra: 'Driver non-compliant', label: 'Critical' },
              { severity: 'warning', borderColor: 'border-warning-500', iconBg: 'bg-warning-50', iconText: 'text-warning-600', badgeBg: 'bg-warning-100', badgeText: 'text-warning-700', icon: FiCalendar, title: 'CDL Expiring Soon', desc: 'Maria Santos \u2022 EMP-002', timeIcon: FiClock, timeText: '28 days remaining', timeColor: 'text-warning-600', extra: 'Renewal reminder sent', label: 'Warning' },
              { severity: 'info', borderColor: 'border-info-500', iconBg: 'bg-info-50', iconText: 'text-info-600', badgeBg: 'bg-info-100', badgeText: 'text-info-700', icon: FiActivity, title: 'BASIC Score Updated', desc: 'Crash Indicator increased to 72%', timeIcon: FiClock, timeText: 'Updated 2 hours ago', timeColor: 'text-info-600', extra: null, extraHighlight: '\u2191 +8%', label: 'Info' },
            ].map((alert, idx) => (
              <div
                key={idx}
                className={`bg-white rounded-lg border-l-4 ${alert.borderColor} p-3 flex items-start gap-3 transition-all duration-700 ${isVisible ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-4'}`}
                style={{ transitionDelay: `${idx * 150}ms` }}
              >
                <div className={`w-9 h-9 rounded-lg ${alert.iconBg} ${alert.iconText} flex items-center justify-center flex-shrink-0`}>
                  <alert.icon className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <span className="text-xs font-semibold text-zinc-800">{alert.title}</span>
                    <span className={`px-2 py-0.5 ${alert.badgeBg} ${alert.badgeText} rounded-full text-[8px] font-bold uppercase tracking-wide flex-shrink-0`}>{alert.label}</span>
                  </div>
                  <div className="text-[10px] text-zinc-600 mb-1.5">{alert.desc}</div>
                  <div className="flex items-center gap-2 text-[9px]">
                    <div className={`flex items-center gap-1 ${alert.timeColor}`}>
                      <alert.timeIcon className="w-3 h-3" />
                      <span className="font-medium">{alert.timeText}</span>
                    </div>
                    <span className="text-zinc-400">&bull;</span>
                    {alert.extra && <span className="text-zinc-500">{alert.extra}</span>}
                    {alert.extraHighlight && <span className="text-danger-600 font-medium">{alert.extraHighlight}</span>}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* DataQ Challenge Preview */}
      {preview === 'dataq' && (
        <div className="mt-6 p-4 rounded-xl bg-indigo-50">
          {/* Violation Card */}
          <div
            className={`bg-white rounded-lg border border-indigo-200 p-3 mb-3 transition-all duration-700 ${isVisible ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}`}
          >
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-lg bg-warning-50 text-warning-600 flex items-center justify-center flex-shrink-0">
                <FiAlertTriangle className="w-4 h-4" />
              </div>
              <div className="flex-1">
                <div className="text-xs font-semibold text-zinc-800 mb-0.5">Vehicle Maintenance Violation</div>
                <div className="text-[10px] text-zinc-500">Inspection #IR-2024-00834</div>
                <div className="flex items-center gap-2 mt-1.5 text-[9px]">
                  <span className="text-zinc-600">Nov 15, 2024</span>
                  <span className="text-zinc-400">&bull;</span>
                  <span className="px-1.5 py-0.5 bg-warning-100 text-warning-700 rounded text-[8px] font-medium">4 points</span>
                </div>
              </div>
            </div>
            <div className="mt-2 p-2 bg-zinc-50 rounded text-[9px] text-zinc-600 leading-relaxed italic">
              &ldquo;Brake out of adjustment&rdquo; &mdash; Level 2 roadside inspection in Ohio
            </div>
          </div>

          {/* AI Detection Badge */}
          <div
            className={`flex items-center justify-center gap-2 mb-3 transition-all duration-700 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'}`}
            style={{ transitionDelay: '150ms' }}
          >
            <div className="flex-1 h-px bg-gradient-to-r from-transparent via-indigo-300 to-transparent"></div>
            <div className="px-3 py-1.5 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-lg text-[9px] font-bold uppercase tracking-wide flex items-center gap-1.5 shadow-md">
              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2L9 9l-7 3 7 3 3 7 3-7 7-3-7-3-3-7z"/></svg>
              Challenge Recommended
            </div>
            <div className="flex-1 h-px bg-gradient-to-r from-indigo-300 via-transparent to-transparent"></div>
          </div>

          {/* DataQ Letter Preview */}
          <div
            className={`bg-white rounded-lg border border-indigo-200 p-3 mb-3 transition-all duration-700 ${isVisible ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}`}
            style={{ transitionDelay: '300ms' }}
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <FiFileText className="w-4 h-4 text-indigo-600" />
                <span className="text-xs font-semibold text-zinc-800">DataQ Letter Generated</span>
              </div>
              <span className="px-2 py-0.5 bg-success-100 text-success-700 rounded-full text-[8px] font-medium">✓ Ready</span>
            </div>
            <div className="bg-gradient-to-br from-zinc-50 to-zinc-100 rounded p-2.5 border border-zinc-200">
              <div className="text-[9px] text-zinc-700 leading-relaxed space-y-1">
                <p className="font-mono">TO: FMCSA DataQs System</p>
                <p className="font-mono">RE: Challenge to Inspection #IR-2024-00834</p>
                <div className="h-px bg-zinc-300 my-1.5"></div>
                <p className="italic text-zinc-600">We respectfully challenge the &ldquo;brake out of adjustment&rdquo; violation based on documented maintenance records showing brake system adjustment performed 3 days prior to inspection...</p>
              </div>
            </div>
          </div>

          {/* Success Metrics */}
          <div
            className={`bg-white rounded-lg border border-indigo-200 p-3 transition-all duration-700 ${isVisible ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}`}
            style={{ transitionDelay: '450ms' }}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-semibold text-zinc-800">Historical Success Rate</span>
              <span className="text-xs font-bold text-success-600">40%</span>
            </div>
            <div className="h-2 bg-zinc-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-success-500 to-success-400 rounded-full transition-all duration-1000"
                style={{ width: isVisible ? '40%' : '0%' }}
              />
            </div>
            <div className="flex items-center justify-between mt-2 text-[9px] text-zinc-500">
              <span>126 challenges submitted</span>
              <span className="text-success-600 font-medium">50 violations removed</span>
            </div>
          </div>
        </div>
      )}
    </div>
  </div>
);

export default Platform;
