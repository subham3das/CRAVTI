import { useState, useEffect } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { NAV_ITEMS, RESTAURANT_INFO } from '../constants/navigation';
import { FiLogOut, FiX, FiChevronDown } from 'react-icons/fi';
import { MdQrCodeScanner } from 'react-icons/md';

export const Sidebar = ({
  isOpen,
  onClose,
  onLogoutClick,
}) => {
  const location = useLocation();
  const [expandedSections, setExpandedSections] = useState({
    Menu: location.pathname.startsWith('/menu') || location.pathname.startsWith('/categories'),
    'Tables & QR': location.pathname.startsWith('/tables') || location.pathname.startsWith('/qr-codes'),
  });

  useEffect(() => {
    if (location.pathname.startsWith('/menu') || location.pathname.startsWith('/categories')) {
      setExpandedSections((prev) => ({ ...prev, Menu: true }));
    }
    if (location.pathname.startsWith('/tables') || location.pathname.startsWith('/qr-codes')) {
      setExpandedSections((prev) => ({ ...prev, 'Tables & QR': true }));
    }
  }, [location.pathname]);

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 bg-slate-900/40 z-40 lg:hidden transition-opacity"
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 w-64 bg-white border-r border-slate-200 flex flex-col transition-transform duration-200 ease-in-out lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand Header */}
        <div className="h-16 flex items-center justify-between px-6 border-b border-slate-200">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg bg-[#16A34A] flex items-center justify-center text-white shadow-sm">
              <MdQrCodeScanner className="w-5 h-5" />
            </div>
            <div>
              <span className="font-bold text-base tracking-tight text-slate-900 block leading-tight">
                {RESTAURANT_INFO.logoText}
              </span>
              <span className="text-[10px] font-semibold uppercase tracking-wider text-[#16A34A] block">
                Restaurant Panel
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="lg:hidden p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
          >
            <FiX className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation List */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;

            if (item.isExpandable) {
              const isChildActive = item.children.some((c) => location.pathname === c.path);
              const isExpanded = !!expandedSections[item.name];

              return (
                <div key={item.name} className="space-y-1">
                  <button
                    type="button"
                    onClick={() =>
                      setExpandedSections((prev) => ({
                        ...prev,
                        [item.name]: !prev[item.name],
                      }))
                    }
                    className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                      isChildActive || isExpanded
                        ? 'bg-slate-50 text-slate-900'
                        : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Icon
                        className={`w-4 h-4 shrink-0 ${
                          isChildActive ? 'text-[#16A34A]' : 'text-slate-400'
                        }`}
                      />
                      <span>{item.name}</span>
                    </div>
                    <FiChevronDown
                      className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${
                        isExpanded ? 'rotate-180 text-slate-600' : ''
                      }`}
                    />
                  </button>

                  {/* Submenu Items */}
                  {isExpanded && (
                    <div className="pl-9 pr-1 space-y-1 py-1">
                      {item.children.map((child) => {
                        const ChildIcon = child.icon;
                        const active = location.pathname === child.path;

                        return (
                          <NavLink
                            key={child.path}
                            to={child.path}
                            onClick={onClose}
                            className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                              active
                                ? 'bg-emerald-50 text-[#16A34A] font-semibold'
                                : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                            }`}
                          >
                            <ChildIcon
                              className={`w-3.5 h-3.5 shrink-0 ${
                                active ? 'text-[#16A34A]' : 'text-slate-400'
                              }`}
                            />
                            <span>{child.name}</span>
                          </NavLink>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            }

            return (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={onClose}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-emerald-50 text-[#16A34A]'
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    <Icon
                      className={`w-4 h-4 shrink-0 ${
                        isActive ? 'text-[#16A34A]' : 'text-slate-400'
                      }`}
                    />
                    <span>{item.name}</span>
                  </>
                )}
              </NavLink>
            );
          })}
        </nav>

        {/* Bottom Actions */}
        <div className="p-3 border-t border-slate-200">
          <button
            type="button"
            onClick={() => {
              if (onClose) onClose();
              if (onLogoutClick) onLogoutClick();
            }}
            className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm font-medium text-red-600 hover:bg-red-50 transition-colors"
          >
            <FiLogOut className="w-4 h-4 shrink-0 text-red-500" />
            <span>Logout</span>
          </button>
        </div>
      </aside>
    </>
  );
};
