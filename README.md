# BeUnblurred

BeUnblurred is a custom BeReal client that lets you see your friends' BeReals without posting one.[^1]

[Visit the website!](https://www.beunblurred.co/)

## Screenshots

- [Friends feed](https://i.marco.win/Screenshot_20240225-100637.png)
- [User page](https://i.marco.win/Screenshot_20240225-100631.png)
- [Friend page](https://i.marco.win/Screenshot_20240225-101532.png)

## How to run locally

1. Clone this repository.
2. Run `npm install` in the repository directory.
3. Create a `.env.local` file with the following content:
```env
NEXT_PUBLIC_NO_ARCHIVER=1
```
4. Run `npm run build` in the repository directory.
5. Run `npm start` in the repository directory.
6. Open `http://localhost:3290` in your browser.

[^1]: Only for your friends' BeReals. Friends of Friends posts won't work if you don't post a BeReal.
