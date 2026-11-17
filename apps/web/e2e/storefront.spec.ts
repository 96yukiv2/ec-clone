import {test,expect} from '@playwright/test';

test('商品一覧から商品詳細へ移動できる',async({page})=>{
 await page.goto('/');
 await expect(page.getByRole('heading',{name:/商品一覧/})).toBeVisible();
 await page.locator('a.card').first().click();
 await expect(page.getByRole('button',{name:'カートに追加'})).toBeVisible();
});

test('検索条件を送信できる',async({page})=>{
 await page.goto('/');
 await page.getByPlaceholder('商品名・キーワード').fill('Book');
 await page.getByRole('button',{name:'検索・絞り込み'}).click();
 await expect(page).toHaveURL(/search=Book/);
});

test('会員登録→カート→注文→Mock決済→購入履歴を確認できる',async({page})=>{
 await page.goto('/account');
 const address='e2e-'+Date.now()+'@example.test';
 await page.getByPlaceholder('名前（新規登録用）').fill('E2E利用者');
 await page.getByPlaceholder('メールアドレス').fill(address);
 await page.getByPlaceholder('パスワード（10文字以上）').fill('e2e-local-password-12345');
 await page.getByRole('button',{name:'新規登録'}).click();
 await expect(page.getByText(address)).toBeVisible();
 await page.goto('/');
 await page.locator('a.card').first().click();
 await page.getByRole('button',{name:'カートに追加'}).click();
 await expect(page.getByText('カートに追加しました')).toBeVisible();
 await page.goto('/cart');
 await expect(page.getByRole('button',{name:'注文を作成'})).toBeEnabled();
 await page.getByRole('button',{name:'注文を作成'}).click();
 await expect(page).toHaveURL(/\/orders/);
 await expect(page.getByRole('button',{name:'Mock決済成功'}).first()).toBeVisible();
 await page.getByRole('button',{name:'Mock決済成功'}).first().click();
 await expect(page.getByText('paid').first()).toBeVisible();
});
