/**
 * Locksy Extension - Performance Test Suite
 * Tests memory usage, CPU impact, and bfcache compatibility
 */

const puppeteer = require('puppeteer');
const path = require('path');

// Test configuration
const TEST_URLS = [
  'https://www.google.com',
  'https://www.youtube.com',
  'https://www.github.com',
  'https://www.reddit.com',
  'https://www.wikipedia.org',
  'https://www.twitter.com',
  'https://www.amazon.com',
  'https://www.netflix.com',
  'https://www.facebook.com',
  'https://www.linkedin.com'
];

const EXTENSION_PATH = path.join(__dirname, '..');

class PerformanceTest {
  constructor() {
    this.browser = null;
    this.results = {
      memoryUsage: [],
      loadTimes: [],
      bfcacheTests: [],
      resourceUsage: [],
      errors: []
    };
  }

  async initialize() {
    console.log('🚀 Initializing Performance Test Suite...\n');
    
    // Launch browser with extension loaded
    this.browser = await puppeteer.launch({
      headless: false, // Run with UI to see extension behavior
      args: [
        `--disable-extensions-except=${EXTENSION_PATH}`,
        `--load-extension=${EXTENSION_PATH}`,
        '--no-sandbox',
        '--disable-setuid-sandbox'
      ]
    });

    console.log('✅ Browser launched with Locksy extension loaded\n');
  }

  async testMemoryUsage() {
    console.log('📊 Testing Memory Usage...\n');
    
    const page = await this.browser.newPage();

    for (const url of TEST_URLS) {
      try {
        console.log(`  Testing: ${url}`);
        
        // Navigate to page
        await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });
        
        // Get memory metrics
        const metrics = await page.metrics();
        const memoryUsage = {
          url,
          jsHeapUsedSize: (metrics.JSHeapUsedSize / 1024 / 1024).toFixed(2) + ' MB',
          jsHeapTotalSize: (metrics.JSHeapTotalSize / 1024 / 1024).toFixed(2) + ' MB',
          timestamp: new Date().toISOString()
        };

        this.results.memoryUsage.push(memoryUsage);
        console.log(`    ✓ Memory: ${memoryUsage.jsHeapUsedSize} used / ${memoryUsage.jsHeapTotalSize} total`);

        // Wait a bit between tests
        await page.waitForTimeout(2000);
      } catch (error) {
        console.log(`    ✗ Error: ${error.message}`);
        this.results.errors.push({ url, error: error.message, test: 'memory' });
      }
    }

    await page.close();
    console.log('\n✅ Memory usage testing complete\n');
  }

  async testPageLoadPerformance() {
    console.log('⚡ Testing Page Load Performance...\n');
    
    const page = await this.browser.newPage();

    for (const url of TEST_URLS) {
      try {
        console.log(`  Testing: ${url}`);
        
        const startTime = Date.now();
        await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });
        const loadTime = Date.now() - startTime;

        const performance = {
          url,
          loadTime: loadTime + 'ms',
          timestamp: new Date().toISOString()
        };

        this.results.loadTimes.push(performance);
        console.log(`    ✓ Load time: ${loadTime}ms`);

        await page.waitForTimeout(1000);
      } catch (error) {
        console.log(`    ✗ Error: ${error.message}`);
        this.results.errors.push({ url, error: error.message, test: 'load-time' });
      }
    }

    await page.close();
    console.log('\n✅ Page load performance testing complete\n');
  }

  async testBfcacheCompatibility() {
    console.log('🔄 Testing Back/Forward Cache Compatibility...\n');
    
    const page = await this.browser.newPage();

    // Enable Chrome DevTools Protocol for bfcache testing
    const client = await page.target().createCDPSession();
    await client.send('Page.enable');

    const testUrl = 'https://www.example.com';
    
    try {
      console.log(`  Testing bfcache on: ${testUrl}`);
      
      // Navigate to first page
      await page.goto(testUrl, { waitUntil: 'networkidle2' });
      console.log('    ✓ Initial page load');

      // Navigate to second page
      await page.goto('https://www.google.com', { waitUntil: 'networkidle2' });
      console.log('    ✓ Navigated to second page');

      // Go back (should use bfcache if compatible)
      await page.goBack({ waitUntil: 'networkidle2' });
      console.log('    ✓ Navigated back');

      // Check if page was restored from bfcache
      const bfcacheStatus = await page.evaluate(() => {
        return {
          pageshow: window.performance.getEntriesByType('navigation')[0]?.type,
          transferSize: window.performance.getEntriesByType('navigation')[0]?.transferSize,
          timestamp: new Date().toISOString()
        };
      });

      this.results.bfcacheTests.push({
        url: testUrl,
        navigationType: bfcacheStatus.pageshow,
        transferSize: bfcacheStatus.transferSize,
        bfcacheUsed: bfcacheStatus.transferSize === 0 ? 'Likely (0 bytes transferred)' : 'No (data transferred)',
        timestamp: bfcacheStatus.timestamp
      });

      console.log(`    ✓ Navigation type: ${bfcacheStatus.pageshow}`);
      console.log(`    ✓ Transfer size: ${bfcacheStatus.transferSize} bytes`);
      console.log(`    ${bfcacheStatus.transferSize === 0 ? '✓ bfcache likely used!' : '⚠️  bfcache may not be used'}`);

    } catch (error) {
      console.log(`    ✗ Error: ${error.message}`);
      this.results.errors.push({ url: testUrl, error: error.message, test: 'bfcache' });
    }

    await page.close();
    console.log('\n✅ bfcache compatibility testing complete\n');
  }

  async testResourceUsage() {
    console.log('💻 Testing System Resource Usage...\n');
    
    const page = await this.browser.newPage();

    try {
      // Test on a content-heavy site
      const url = 'https://www.youtube.com';
      console.log(`  Testing resource usage on: ${url}`);
      
      await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });

      // Get performance metrics
      const metrics = await page.metrics();
      
      const resources = {
        url,
        jsEventListeners: metrics.JSEventListeners,
        documents: metrics.Documents,
        frames: metrics.Frames,
        jsHeapUsedSize: (metrics.JSHeapUsedSize / 1024 / 1024).toFixed(2) + ' MB',
        nodes: metrics.Nodes,
        layoutCount: metrics.LayoutCount,
        recalcStyleCount: metrics.RecalcStyleCount,
        timestamp: new Date().toISOString()
      };

      this.results.resourceUsage.push(resources);

      console.log(`    ✓ JS Event Listeners: ${resources.jsEventListeners}`);
      console.log(`    ✓ Documents: ${resources.documents}`);
      console.log(`    ✓ Frames: ${resources.frames}`);
      console.log(`    ✓ DOM Nodes: ${resources.nodes}`);
      console.log(`    ✓ Layout Count: ${resources.layoutCount}`);
      console.log(`    ✓ Style Recalc: ${resources.recalcStyleCount}`);
      console.log(`    ✓ Heap Used: ${resources.jsHeapUsedSize}`);

    } catch (error) {
      console.log(`    ✗ Error: ${error.message}`);
      this.results.errors.push({ test: 'resource-usage', error: error.message });
    }

    await page.close();
    console.log('\n✅ Resource usage testing complete\n');
  }

  async testExtensionImpact() {
    console.log('🔬 Testing Extension Impact on Page Performance...\n');
    
    const page = await this.browser.newPage();

    try {
      const url = 'https://www.wikipedia.org';
      console.log(`  Testing extension impact on: ${url}`);
      
      // Enable performance tracking
      await page.goto(url, { waitUntil: 'networkidle2' });

      // Get performance timing
      const timing = await page.evaluate(() => {
        const perf = window.performance.timing;
        return {
          dns: perf.domainLookupEnd - perf.domainLookupStart,
          tcp: perf.connectEnd - perf.connectStart,
          request: perf.responseStart - perf.requestStart,
          response: perf.responseEnd - perf.responseStart,
          dom: perf.domComplete - perf.domLoading,
          load: perf.loadEventEnd - perf.loadEventStart,
          total: perf.loadEventEnd - perf.navigationStart
        };
      });

      console.log(`    ✓ DNS Lookup: ${timing.dns}ms`);
      console.log(`    ✓ TCP Connection: ${timing.tcp}ms`);
      console.log(`    ✓ Request: ${timing.request}ms`);
      console.log(`    ✓ Response: ${timing.response}ms`);
      console.log(`    ✓ DOM Processing: ${timing.dom}ms`);
      console.log(`    ✓ Load Event: ${timing.load}ms`);
      console.log(`    ✓ Total Time: ${timing.total}ms`);

      this.results.resourceUsage.push({ url, timing, timestamp: new Date().toISOString() });

    } catch (error) {
      console.log(`    ✗ Error: ${error.message}`);
      this.results.errors.push({ test: 'extension-impact', error: error.message });
    }

    await page.close();
    console.log('\n✅ Extension impact testing complete\n');
  }

  generateReport() {
    console.log('\n' + '='.repeat(80));
    console.log('📋 PERFORMANCE TEST REPORT - LOCKSY EXTENSION');
    console.log('='.repeat(80) + '\n');

    console.log('Test Date:', new Date().toISOString());
    console.log('Extension Path:', EXTENSION_PATH);
    console.log('\n');

    // Memory Usage Summary
    console.log('📊 MEMORY USAGE SUMMARY:');
    console.log('-'.repeat(80));
    if (this.results.memoryUsage.length > 0) {
      const avgMemory = this.results.memoryUsage.reduce((sum, m) => {
        return sum + parseFloat(m.jsHeapUsedSize);
      }, 0) / this.results.memoryUsage.length;
      
      console.log(`Average Memory Usage: ${avgMemory.toFixed(2)} MB`);
      console.log(`Sites Tested: ${this.results.memoryUsage.length}`);
      console.log(`Max Memory: ${Math.max(...this.results.memoryUsage.map(m => parseFloat(m.jsHeapUsedSize))).toFixed(2)} MB`);
      console.log(`Min Memory: ${Math.min(...this.results.memoryUsage.map(m => parseFloat(m.jsHeapUsedSize))).toFixed(2)} MB`);
    }
    console.log('\n');

    // Load Time Summary
    console.log('⚡ PAGE LOAD PERFORMANCE:');
    console.log('-'.repeat(80));
    if (this.results.loadTimes.length > 0) {
      const avgLoadTime = this.results.loadTimes.reduce((sum, l) => {
        return sum + parseFloat(l.loadTime);
      }, 0) / this.results.loadTimes.length;
      
      console.log(`Average Load Time: ${avgLoadTime.toFixed(0)}ms`);
      console.log(`Sites Tested: ${this.results.loadTimes.length}`);
      console.log(`Fastest Load: ${Math.min(...this.results.loadTimes.map(l => parseFloat(l.loadTime))).toFixed(0)}ms`);
      console.log(`Slowest Load: ${Math.max(...this.results.loadTimes.map(l => parseFloat(l.loadTime))).toFixed(0)}ms`);
    }
    console.log('\n');

    // bfcache Results
    console.log('🔄 BACK/FORWARD CACHE COMPATIBILITY:');
    console.log('-'.repeat(80));
    if (this.results.bfcacheTests.length > 0) {
      this.results.bfcacheTests.forEach(test => {
        console.log(`URL: ${test.url}`);
        console.log(`Navigation Type: ${test.navigationType}`);
        console.log(`bfcache Status: ${test.bfcacheUsed}`);
      });
    }
    console.log('\n');

    // Errors
    console.log('❌ ERRORS ENCOUNTERED:');
    console.log('-'.repeat(80));
    if (this.results.errors.length > 0) {
      this.results.errors.forEach(err => {
        console.log(`Test: ${err.test}, URL: ${err.url || 'N/A'}, Error: ${err.error}`);
      });
    } else {
      console.log('✅ No errors encountered!');
    }
    console.log('\n');

    // Overall Assessment
    console.log('✅ OVERALL PERFORMANCE ASSESSMENT:');
    console.log('-'.repeat(80));
    
    const avgMemory = this.results.memoryUsage.length > 0 
      ? this.results.memoryUsage.reduce((sum, m) => sum + parseFloat(m.jsHeapUsedSize), 0) / this.results.memoryUsage.length
      : 0;
    
    const avgLoadTime = this.results.loadTimes.length > 0
      ? this.results.loadTimes.reduce((sum, l) => sum + parseFloat(l.loadTime), 0) / this.results.loadTimes.length
      : 0;

    console.log('Performance Rating:');
    console.log(`  Memory Usage: ${avgMemory < 50 ? '✅ EXCELLENT' : avgMemory < 100 ? '⚠️  GOOD' : '❌ NEEDS OPTIMIZATION'} (${avgMemory.toFixed(2)} MB avg)`);
    console.log(`  Load Time: ${avgLoadTime < 3000 ? '✅ EXCELLENT' : avgLoadTime < 5000 ? '⚠️  GOOD' : '❌ NEEDS OPTIMIZATION'} (${avgLoadTime.toFixed(0)}ms avg)`);
    console.log(`  Error Rate: ${this.results.errors.length === 0 ? '✅ EXCELLENT' : this.results.errors.length < 3 ? '⚠️  ACCEPTABLE' : '❌ NEEDS ATTENTION'} (${this.results.errors.length} errors)`);
    
    const canConfirmPerformance = avgMemory < 100 && avgLoadTime < 5000 && this.results.errors.length < 3;
    console.log('\n');
    console.log('🎯 CHROME WEB STORE SUBMISSION:');
    console.log(`  Can check "Performance" box? ${canConfirmPerformance ? '✅ YES' : '❌ NO, NEEDS OPTIMIZATION'}`);
    
    console.log('\n' + '='.repeat(80) + '\n');

    return {
      passed: canConfirmPerformance,
      avgMemory,
      avgLoadTime,
      errorCount: this.results.errors.length
    };
  }

  async saveResults() {
    const fs = require('fs');
    const reportPath = path.join(__dirname, 'performance-report.json');
    
    fs.writeFileSync(reportPath, JSON.stringify({
      testDate: new Date().toISOString(),
      results: this.results,
      summary: {
        totalTests: TEST_URLS.length,
        errorCount: this.results.errors.length,
        memoryTests: this.results.memoryUsage.length,
        loadTimeTests: this.results.loadTimes.length,
        bfcacheTests: this.results.bfcacheTests.length
      }
    }, null, 2));

    console.log(`📄 Detailed results saved to: ${reportPath}\n`);
  }

  async cleanup() {
    if (this.browser) {
      await this.browser.close();
    }
  }

  async run() {
    try {
      await this.initialize();
      await this.testMemoryUsage();
      await this.testPageLoadPerformance();
      await this.testBfcacheCompatibility();
      await this.testResourceUsage();
      await this.testExtensionImpact();
      
      const summary = this.generateReport();
      await this.saveResults();
      
      return summary;
    } catch (error) {
      console.error('❌ Test suite error:', error);
      throw error;
    } finally {
      await this.cleanup();
    }
  }
}

// Run tests if executed directly
if (require.main === module) {
  const test = new PerformanceTest();
  test.run()
    .then(summary => {
      console.log('✅ All tests completed!');
      process.exit(summary.passed ? 0 : 1);
    })
    .catch(error => {
      console.error('❌ Test failed:', error);
      process.exit(1);
    });
}

module.exports = PerformanceTest;
