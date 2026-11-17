import {test,expect} from '@playwright/test';
test('商品一覧から商品詳細へ移動できる',async({page})=>{
 await page.goto('/');
 await expect(page.getByRole('heading',{name:'商品一覧'})).toBeVisible();
 await page.locator('a.card').first().click();
 await expect(page.getByRole('button',{name:'カートに追加'})).toBeVisible();
});
test('商品検索と価格絞り込みを送信できる',async({page})=>{
 await page.goto('/');
 await page.getByPlaceholder('商品名・キーワード').fill('Book');
 await page.getByRole('button',{name:'検索・絞り込み'}).click();
 await expect(page).toHaveURL(/search=Book/);
});
