import {test,expect} from '@playwright/test';
test('商品一覧から詳細へ移動できる',async({page})=>{
 await page.goto('/');
 await expect(page.getByRole('heading',{name:/商品一覧/})).toBeVisible();
 await page.locator('.product-card-link').first().click();
 await expect(page.getByRole('button',{name:'カートに追加'})).toBeVisible();
});
test('商品検索を使える',async({page})=>{
 await page.goto('/');
 await page.getByPlaceholder('商品名・キーワード').fill('Book');
 await page.getByRole('button',{name:'検索・絞り込み'}).click();
 await expect(page).toHaveURL(/search=Book/);
});
test('ゲストでも一覧からカートとお気に入りを追加できる',async({page})=>{
 await page.goto('/');
 await expect(page.getByText('ゲスト｜ログイン・登録')).toBeVisible();
 await page.getByRole('button',{name:'カートに追加'}).first().click();
 await expect(page.getByRole('navigation',{name:'メインメニュー'}).getByText('1')).toBeVisible();
 await page.getByRole('button',{name:/のお気に入り操作/}).first().click();
 await page.getByRole('link',{name:/お気に入り/}).first().click();
 await expect(page.getByText('ゲストのお気に入りを表示しています。')).toBeVisible();
 await expect(page.getByRole('button',{name:'お気に入りから削除'})).toBeVisible();
});
test('会員登録→カート→注文→Mock決済',async({page})=>{
 await page.goto('/account');
 const email='e2e-'+Date.now()+'@example.test';
 await page.getByPlaceholder('名前（新規登録用）').fill('E2E利用者');
 await page.getByPlaceholder('メールアドレス').fill(email);
 await page.getByPlaceholder('パスワード（10文字以上）').fill('e2e-local-password-12345');
 await page.getByRole('button',{name:'新規登録'}).click();
 await expect(page.getByText(email)).toBeVisible();
 await expect(page.getByText('✓ E2E利用者（ログイン中）')).toBeVisible();
 await page.goto('/');
 await page.locator('.product-card-link').first().click();
 await page.getByRole('button',{name:'カートに追加'}).click();
 await expect(page.getByText('カートに追加しました')).toBeVisible();
 await page.goto('/cart');
 await page.getByRole('button',{name:'注文を作成'}).click();
 await expect(page).toHaveURL(/\/orders/);
 await page.getByRole('button',{name:'Mock決済成功'}).first().click();
 await expect(page.getByText('支払い済み').first()).toBeVisible();
});
