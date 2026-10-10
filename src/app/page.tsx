"use client";

import React, { useState } from "react";
import { Header } from "@/components/Header";
import { Banner } from "@/components/Banner";
import { ThoughtFeed } from "@/components/ThoughtFeed";
import { ReelFeed } from "@/components/ReelFeed";
import { InlineComposerBar } from "@/components/InlineComposerBar";
import { ThoughtComposer, FloatingComposerButton } from "@/components/ThoughtComposer";
import { ReelComposer } from "@/components/ReelComposer";
import { AiChatView } from "@/components/AiChatView";
import { AiFloatingModal, FloatingAiButton } from "@/components/AiFloatingModal";
import { Sidebar } from "@/components/Sidebar";
import { SettingsModal } from "@/components/SettingsModal";
import { CommunityModal, CommunityFloatingButton } from "@/components/CommunityModal";
import { SortOrder, ActiveTab, Thought, ReelItem } from "@/types/thought";
import { useAuth } from "@/lib/auth";
import { AuthScreen } from "@/components/AuthScreen";
import { useScrollLock } from "@/lib/useScrollLock";

export default function HomePage() {
  const { isAuthenticated, isLoading, requireAuth, openLoginModal } = useAuth();
  const [activeTab, setActiveTab] = useState<ActiveTab>("thoughts");
  const [sortOrder, setSortOrder] = useState<SortOrder>("recent");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [surpriseTrigger, setSurpriseTrigger] = useState<number>(0);

  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isThoughtComposerOpen, setIsThoughtComposerOpen] = useState(false);
  const [isReelComposerOpen, setIsReelComposerOpen] = useState(false);
  const [isFloatingAiOpen, setIsFloatingAiOpen] = useState(false);
  const [isCommunityOpen, setIsCommunityOpen] = useState(false);
  const [prefilledThoughtText, setPrefilledThoughtText] = useState("");
  const [prefilledCategory, setPrefilledCategory] = useState<string | undefined>(undefined);

  const [newlyDroppedThought, setNewlyDroppedThought] = useState<Thought | null>(null);
  const [newlyDroppedReel, setNewlyDroppedReel] = useState<ReelItem | null>(null);

  // Freeze background scrolling whenever ANY modal/drawer is open
  const isAnyModalOpen =
    isSidebarOpen ||
    isSettingsOpen ||
    isThoughtComposerOpen ||
    isReelComposerOpen ||
    isFloatingAiOpen ||
    isCommunityOpen;
  useScrollLock(isAnyModalOpen);

  const handleClearSearch = () => {
    setSearchQuery("");
  };

  const handleResetCategory = () => {
    setSelectedCategory("All");
  };

  const handleSurpriseMe = () => {
    setSurpriseTrigger(Date.now());
  };

  const handleOpenThoughtComposer = () => {
    setPrefilledThoughtText("");
    setPrefilledCategory(undefined);
    requireAuth(() => setIsThoughtComposerOpen(true), "Sign in to drop your relatable thoughts");
  };

  const handleOpenReelComposer = () => {
    requireAuth(() => setIsReelComposerOpen(true), "Sign in to drop a community video reel");
  };

  const handleDropAiThought = (thoughtText: string, category?: string) => {
    setPrefilledThoughtText(thoughtText);
    if (category) setPrefilledCategory(category);
    requireAuth(() => setIsThoughtComposerOpen(true), "Sign in to drop your AI-crafted thought");
  };

  return (
    <div className="min-h-screen flex flex-col antialiased transition-colors duration-300">
      {/* 1. Header with Tab Switcher, Global Search & Category Pills */}
      <Header
        activeTab={activeTab}
        onTabChange={(tab) => {
          setActiveTab(tab);
          setSearchQuery("");
        }}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        selectedCategory={selectedCategory}
        onSelectCategory={setSelectedCategory}
        onToggleSidebar={() => setIsSidebarOpen(true)}
      />

      {/* 2. Main Content Container */}
      <main className="flex-1 w-full max-w-xl mx-auto px-2 py-3">
        {activeTab === "ai" ? (
          /* Dedicated AI Chat View */
          <AiChatView onDropThought={handleDropAiThought} />
        ) : activeTab === "thoughts" ? (
          <>
            {/* Top Concept Banner */}
            {!searchQuery && selectedCategory === "All" && (
              <Banner
                onOpenComposer={handleOpenThoughtComposer}
                onSwitchToReels={() => setActiveTab("reels")}
                onSwitchToAi={() => setActiveTab("ai")}
                onSurpriseMe={handleSurpriseMe}
              />
            )}

            {/* Fast Inline Thought Composer Bar */}
            <InlineComposerBar onOpen={handleOpenThoughtComposer} />

            {/* Continuous Thought Feed */}
            <ThoughtFeed
              sortOrder={sortOrder}
              onOpenComposer={handleOpenThoughtComposer}
              newlyDroppedThought={newlyDroppedThought}
              searchQuery={searchQuery}
              onClearSearch={handleClearSearch}
              selectedCategory={selectedCategory}
              onResetCategory={handleResetCategory}
              surpriseTrigger={surpriseTrigger}
            />
          </>
        ) : (
          <ReelFeed
            newlyDroppedReel={newlyDroppedReel}
            searchQuery={searchQuery}
            onClearSearch={handleClearSearch}
          />
        )}
      </main>

      {/* 3. Community Trigger Button (Pinned to Bottom-Left Corner per user request) */}
      <div className="fixed bottom-5 sm:bottom-6 left-4 sm:left-6 z-40">
        <CommunityFloatingButton onClick={() => setIsCommunityOpen(true)} />
      </div>

      {/* 4. Floating Action Buttons (Clean Vertical Stack - Zero Overlap on Right) */}
      <div className="fixed bottom-5 sm:bottom-6 right-4 sm:right-6 z-40 flex flex-col items-end gap-2.5 sm:gap-3 pointer-events-none">
        {activeTab !== "ai" && (
          <div className="pointer-events-auto">
            <FloatingAiButton onClick={() => setIsFloatingAiOpen(true)} />
          </div>
        )}

        <div className="pointer-events-auto">
          <FloatingComposerButton
            onClick={() => {
              if (activeTab === "reels") handleOpenReelComposer();
              else handleOpenThoughtComposer();
            }}
          />
        </div>
      </div>

      {/* 4. Modals */}
      <AiFloatingModal
        isOpen={isFloatingAiOpen}
        onClose={() => setIsFloatingAiOpen(false)}
        onDropThought={handleDropAiThought}
      />

      <ThoughtComposer
        isOpen={isThoughtComposerOpen}
        onClose={() => {
          setIsThoughtComposerOpen(false);
          setPrefilledThoughtText("");
          setPrefilledCategory(undefined);
        }}
        onThoughtCreated={(t) => {
          setNewlyDroppedThought(t);
          setPrefilledThoughtText("");
          setPrefilledCategory(undefined);
        }}
        initialText={prefilledThoughtText}
        initialCategory={prefilledCategory}
      />

      <ReelComposer
        isOpen={isReelComposerOpen}
        onClose={() => setIsReelComposerOpen(false)}
        onReelCreated={(r) => setNewlyDroppedReel(r)}
      />

      {/* 5. Left Navigation Sidebar (Root Level - full viewport coverage) */}
      <Sidebar
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        activeTab={activeTab}
        onTabChange={(tab) => {
          setActiveTab(tab);
          setSearchQuery("");
        }}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        selectedCategory={selectedCategory}
        onSelectCategory={setSelectedCategory}
        sortOrder={sortOrder}
        onSortChange={setSortOrder}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onOpenSwitchAccount={() => openLoginModal("Switch to another creator account")}
        onOpenCommunity={() => setIsCommunityOpen(true)}
      />

      {/* 6. Settings Modal (Root Level - completely free from header clipping) */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        onOpenSwitchAccount={() => {
          setIsSettingsOpen(false);
          openLoginModal("Switch to another creator account");
        }}
      />

      {/* 7. Community Chat & Members Modal */}
      <CommunityModal
        isOpen={isCommunityOpen}
        onClose={() => setIsCommunityOpen(false)}
      />
    </div>
  );
}
