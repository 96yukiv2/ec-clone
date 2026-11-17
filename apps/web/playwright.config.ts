import {defineConfig,devices} from '@playwright/test';
export default defineConfig({
 testDir:'./e2e',timeout:30000,retries:process.env.CI?1:0,
 use:{baseURL:'http://localhost:3000',trace:'retain-on-failure'},
 projects:[{name:'chromium',use:{...devices['Desktop Chrome']}}],
 webServer:[
  {command:'pnpm --filter @ec/api dev',url:'http://localhost:4000/products',timeout:120000,reuseExistingServer:!process.env.CI,env:{PORT:'4000'}},
  {command:'pnpm --filter @ec/web dev',url:'http://localhost:3000',timeout:120000,reuseExistingServer:!process.env.CI}
 ]
});
