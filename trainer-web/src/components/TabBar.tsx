import { useState } from "react";

interface Tab {
  id: string;
  label: string;
}

interface TabBarProps {
  tabs: Tab[];
  activeTab: string;
  onTabChange: (tabId: string) => void;
}

export function TabBar({ tabs, activeTab, onTabChange }: TabBarProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const activeTabLabel = tabs.find((tab) => tab.id === activeTab)?.label || "";

  const handleTabSelect = (tabId: string) => {
    onTabChange(tabId);
    setMobileMenuOpen(false);
  };

  return (
    <div className="relative border-b border-gray-200">
      {/* Mobile burger menu - pure CSS hamburger icon */}
      <div className="flex items-center justify-between md:hidden">
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="flex items-center gap-2 px-4 py-3 text-sm font-medium text-gray-700"
          aria-expanded={mobileMenuOpen}
          aria-label="Toggle menu"
        >
          <span aria-hidden="true">{mobileMenuOpen ? "✕" : "☰"}</span>
          <span>{activeTabLabel}</span>
        </button>
      </div>

      {/* Mobile dropdown menu */}
      {mobileMenuOpen && (
        <div className="absolute left-0 right-0 top-full z-50 border-b border-gray-200 bg-white shadow-lg md:hidden">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              className={`block w-full px-4 py-3 text-left text-sm font-medium transition-colors ${
                activeTab === tab.id
                  ? "bg-red-50 text-red-600"
                  : "text-gray-500 hover:bg-gray-50 hover:text-gray-700"
              }`}
              onClick={() => handleTabSelect(tab.id)}
            >
              {tab.label}
            </button>
          ))}
        </div>
      )}

      {/* Desktop horizontal tabs */}
      <div className="hidden md:flex">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            data-testid={`tab-${tab.id}`}
            className={`px-6 py-3 text-sm font-medium transition-colors ${
              activeTab === tab.id
                ? "border-b-2 border-red-600 text-red-600"
                : "border-b-2 border-transparent text-gray-500 hover:bg-gray-50 hover:text-gray-700"
            }`}
            onClick={() => onTabChange(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </div>
    </div>
  );
}
