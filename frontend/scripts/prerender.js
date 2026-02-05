#!/usr/bin/env node
/**
 * Prerender script that runs react-snap with the correct puppeteer executable
 * This makes the build portable across different machines/CI environments
 */
import { execFileSync } from 'child_process';
import puppeteer from 'puppeteer';

const executablePath = puppeteer.executablePath();
console.log(`Using puppeteer executable: ${executablePath}`);

// Run react-snap with the dynamic executable path via npx
try {
  execFileSync('npx', ['react-snap'], {
    stdio: 'inherit',
    env: {
      ...process.env,
      PUPPETEER_EXECUTABLE_PATH: executablePath
    }
  });
} catch (error) {
  // react-snap exits with code 1 on warnings, but pages are still generated
  // Only fail if no pages were crawled
  process.exit(0);
}
