rm -r dist/*

npm run build
mv dist/demo/* dist/

git push origin --delete gh-pages

git add *
git commit -m "build"
git push

git subtree push --prefix dist origin gh-pages
