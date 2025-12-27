<script setup>
// This landing page component is purely presentational.
// All navigation is handled by <router-link>.
</script>

<template>
  <div
    class="bg-gray-50 dark:bg-gray-900 text-gray-800 dark:text-gray-200 font-sans overflow-x-hidden"
  >
    <!-- Header -->
    <header class="sticky top-0 z-50 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm">
      <div class="container mx-auto px-6 py-4 flex justify-between items-center">
        <div class="flex items-center space-x-2">
          <img src="/coordino-logo.png" alt="Coordino Logo" class="h-8 w-8" />
          <span class="text-xl font-bold text-gray-900 dark:text-white">Coordino</span>
        </div>
        <nav class="hidden md:flex items-center space-x-8">
          <a
            href="#features"
            class="text-gray-600 dark:text-gray-300 hover:text-teal-500 dark:hover:text-teal-400 transition-colors"
          >
            Features
          </a>
          <a
            href="#pricing"
            class="text-gray-600 dark:text-gray-300 hover:text-teal-500 dark:hover:text-teal-400 transition-colors"
          >
            Pricing
          </a>
        </nav>
        <div class="flex items-center space-x-4">
          <router-link
            to="/login"
            class="text-gray-600 dark:text-gray-300 hover:text-teal-500 dark:hover:text-teal-400 text-sm font-medium"
          >
            Log In
          </router-link>
          <router-link
            to="/signup"
            class="bg-teal-500 hover:bg-teal-600 text-white font-bold py-2 px-4 rounded-lg text-sm transition-all shadow-md hover:shadow-lg transform hover:-translate-y-px"
          >
            Get Started
          </router-link>
        </div>
      </div>
    </header>

    <!-- Main Content -->
    <main>
      <!-- Hero Section -->
      <section
        class="relative text-center py-20 lg:py-40 bg-gradient-to-br from-teal-50 via-purple-50 to-cyan-50 dark:from-gray-900 dark:via-teal-900/20 dark:to-gray-900"
      >
        <div
          class="absolute top-0 left-0 w-64 h-64 bg-teal-200 rounded-full opacity-20 dark:opacity-10 -translate-x-16 -translate-y-16 filter blur-2xl"
        ></div>
        <div
          class="absolute bottom-0 right-0 w-64 h-64 bg-purple-200 rounded-full opacity-20 dark:opacity-10 translate-x-16 translate-y-16 filter blur-2xl"
        ></div>

        <div class="container mx-auto px-6 relative">
          <h1
            class="text-4xl md:text-6xl font-extrabold text-gray-900 dark:text-white leading-tight tracking-tighter"
          >
            Your Life's Work,
            <br class="hidden md:block" />
            <span
              class="bg-clip-text text-transparent bg-gradient-to-r from-teal-500 to-purple-500"
            >
              Finally in Harmony.
            </span>
          </h1>
          <p class="mt-6 text-lg md:text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
            Coordino unifies your tasks, notes, and schedule into one beautiful, lightning-fast app.
            Ditch the chaos and find your focus.
          </p>
          <div class="mt-8">
            <router-link
              to="/signup"
              class="bg-teal-500 hover:bg-teal-600 text-white font-bold py-4 px-10 rounded-full text-lg transition-transform transform hover:scale-105 shadow-lg hover:shadow-teal-500/30"
            >
              Start Coordinating for Free
            </router-link>
          </div>
        </div>
      </section>

      <!-- Angled Features Section -->
      <div class="relative">
        <div class="absolute inset-0 bg-white dark:bg-black/20 transform -skew-y-3"></div>
        <section id="features" class="relative py-20 lg:py-32">
          <div class="container mx-auto px-6 space-y-24">
            <!-- Feature 1: Tasks -->
            <div class="grid md:grid-cols-2 gap-12 items-center">
              <div class="text-center md:text-left">
                <span class="text-sm font-bold text-teal-500 uppercase">Tasks</span>
                <h2 class="mt-2 text-3xl md:text-4xl font-bold text-gray-900 dark:text-white">
                  From Chaos to Clarity.
                </h2>
                <p class="mt-4 text-lg text-gray-600 dark:text-gray-400">
                  Transform your scattered to-do lists into a focused workflow. With custom statuses
                  and smart filters, Coordino helps you see what's important and get it done.
                </p>
              </div>
              <div
                class="p-8 bg-gradient-to-br from-teal-50 to-white dark:from-gray-800 dark:to-gray-800/50 rounded-2xl shadow-xl transform hover:rotate-1 transition-transform"
              >
                <img
                  src="/docs/dashboard light screen.png"
                  alt="Task Management in Coordino"
                  class="rounded-lg shadow-lg"
                />
              </div>
            </div>

            <!-- Feature 2: Notes -->
            <div class="grid md:grid-cols-2 gap-12 items-center">
              <div
                class="p-8 bg-gradient-to-bl from-purple-50 to-white dark:from-gray-800 dark:to-gray-800/50 rounded-2xl shadow-xl transform hover:-rotate-1 transition-transform md:order-last"
              >
                <img
                  src="/docs/dashboard dark screen.png"
                  alt="Note Taking in Coordino"
                  class="rounded-lg shadow-lg"
                />
              </div>
              <div class="text-center md:text-left">
                <span class="text-sm font-bold text-purple-500 uppercase">Notes</span>
                <h2 class="mt-2 text-3xl md:text-4xl font-bold text-gray-900 dark:text-white">
                  Your Digital Garden, Tended.
                </h2>
                <p class="mt-4 text-lg text-gray-600 dark:text-gray-400">
                  Plant ideas, cultivate knowledge, and watch it grow. Our clean, rich-text editor
                  and powerful organization tools make it easy to connect thoughts and find them
                  instantly.
                </p>
              </div>
            </div>

            <!-- Feature 3: Scheduling -->
            <div class="grid md:grid-cols-2 gap-12 items-center">
              <div class="text-center md:text-left">
                <span class="text-sm font-bold text-cyan-500 uppercase">Scheduling</span>
                <h2 class="mt-2 text-3xl md:text-4xl font-bold text-gray-900 dark:text-white">
                  Schedule with Empathy.
                </h2>
                <p class="mt-4 text-lg text-gray-600 dark:text-gray-400">
                  Our one-of-a-kind **Meeting Equity Score** finds the fairest time for everyone,
                  everywhere. Stop the back-and-forth and schedule with confidence and respect.
                </p>
              </div>
              <div
                class="p-8 bg-gradient-to-tr from-cyan-50 to-white dark:from-gray-800 dark:to-gray-800/50 rounded-2xl shadow-xl transform hover:rotate-1 transition-transform"
              >
                <img
                  src="/docs/dashboard light screen.png"
                  alt="Scheduling in Coordino"
                  class="rounded-lg shadow-lg"
                />
              </div>
            </div>
          </div>
        </section>
      </div>

      <!-- Pricing Section -->
      <section id="pricing" class="py-20 lg:py-32 bg-gray-50 dark:bg-gray-900">
        <div class="container mx-auto px-6">
          <div class="text-center mb-16">
            <h2 class="text-4xl md:text-5xl font-extrabold text-gray-900 dark:text-white">
              Simple, Transparent Pricing.
            </h2>
            <p class="mt-4 text-lg text-gray-600 dark:text-gray-400">
              Choose the plan that fits your flow.
            </p>
          </div>
          <div class="grid lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
            <!-- Personal Tier -->
            <div
              class="bg-white dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-2xl p-8 flex flex-col transform hover:-translate-y-2 transition-transform"
            >
              <h3 class="text-xl font-bold text-purple-500">Personal</h3>
              <p class="mt-4 text-4xl font-bold text-gray-900 dark:text-white">
                Free
                <span class="text-lg font-medium text-gray-500">/ Forever</span>
              </p>
              <p class="mt-2 text-gray-500 dark:text-gray-400">
                For organizing your life and personal projects.
              </p>
              <ul class="mt-8 space-y-4 text-gray-600 dark:text-gray-300">
                <li class="flex items-center">
                  <span class="text-purple-500 mr-3">✓</span>
                  3 Active Projects
                </li>
                <li class="flex items-center">
                  <span class="text-purple-500 mr-3">✓</span>
                  200 Active Tasks
                </li>
                <li class="flex items-center">
                  <span class="text-purple-500 mr-3">✓</span>
                  100 Notes
                </li>
              </ul>
              <router-link
                to="/signup"
                class="w-full text-center bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-800 dark:text-white font-bold py-3 px-6 rounded-lg mt-8 transition-colors"
              >
                Start for Free
              </router-link>
            </div>
            <!-- Pro Tier -->
            <div
              class="bg-white dark:bg-gray-800 border-2 border-teal-500 rounded-2xl p-8 flex flex-col shadow-2xl shadow-teal-500/20 transform scale-105"
            >
              <h3 class="text-xl font-bold text-teal-500">Pro</h3>
              <p class="mt-4 text-4xl font-bold text-gray-900 dark:text-white">
                $8
                <span class="text-lg font-medium text-gray-500">/ month</span>
              </p>
              <p class="mt-2 text-gray-500 dark:text-gray-400">
                For power users who want to automate their productivity.
              </p>
              <ul class="mt-8 space-y-4 text-gray-600 dark:text-gray-300">
                <li class="flex items-center">
                  <span class="text-teal-500 mr-3">✓</span>
                  **Everything in Personal, plus:**
                </li>
                <li class="flex items-center">
                  <span class="text-teal-500 mr-3">✓</span>
                  Unlimited Everything
                </li>
                <li class="flex items-center">
                  <span class="text-teal-500 mr-3">✓</span>
                  AI-Enhanced Scheduling
                </li>
                <li class="flex items-center">
                  <span class="text-teal-500 mr-3">✓</span>
                  Advanced Note & Task Features
                </li>
              </ul>
              <router-link
                to="/signup"
                class="w-full text-center bg-teal-500 hover:bg-teal-600 text-white font-bold py-3 px-6 rounded-lg mt-8 transition-colors"
              >
                Go Pro
              </router-link>
            </div>
            <!-- Teams Tier -->
            <div
              class="bg-white dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-2xl p-8 flex flex-col transform hover:-translate-y-2 transition-transform"
            >
              <h3 class="text-xl font-bold text-cyan-500">Teams</h3>
              <p class="mt-4 text-4xl font-bold text-gray-900 dark:text-white">
                $15
                <span class="text-lg font-medium text-gray-500">/ user / month</span>
              </p>
              <p class="mt-2 text-gray-500 dark:text-gray-400">
                For teams that need to stay perfectly in sync.
              </p>
              <ul class="mt-8 space-y-4 text-gray-600 dark:text-gray-300">
                <li class="flex items-center">
                  <span class="text-cyan-500 mr-3">✓</span>
                  **Everything in Pro, plus:**
                </li>
                <li class="flex items-center">
                  <span class="text-cyan-500 mr-3">✓</span>
                  Shared Workspaces
                </li>
                <li class="flex items-center">
                  <span class="text-cyan-500 mr-3">✓</span>
                  Collaborative Notes & Tasks
                </li>
                <li class="flex items-center">
                  <span class="text-cyan-500 mr-3">✓</span>
                  Roles & Permissions
                </li>
              </ul>
              <a
                href="#"
                class="w-full text-center bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-800 dark:text-white font-bold py-3 px-6 rounded-lg mt-8 transition-colors"
              >
                Contact Sales
              </a>
            </div>
          </div>
        </div>
      </section>

      <!-- Final CTA -->
      <section class="py-20 lg:py-32">
        <div class="container mx-auto px-6 text-center">
          <h2 class="text-4xl md:text-5xl font-extrabold text-gray-900 dark:text-white">
            Find Your Focus Today.
          </h2>
          <div class="mt-8">
            <router-link
              to="/signup"
              class="bg-gradient-to-r from-teal-500 to-purple-500 hover:from-teal-600 hover:to-purple-600 text-white font-bold py-4 px-10 rounded-full text-lg transition-all shadow-lg hover:shadow-xl"
            >
              Sign Up - It's Free!
            </router-link>
          </div>
        </div>
      </section>
    </main>

    <!-- Footer -->
    <footer class="bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800">
      <div class="container mx-auto px-6 py-6 text-center text-gray-500 dark:text-gray-400 text-sm">
        <p>&copy; 2025 Coordino Inc. All rights reserved.</p>
      </div>
    </footer>
  </div>
</template>
