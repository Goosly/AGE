rm -r dist/*

npm run build-prod
git push origin --delete gh-pages

git add *
git commit -m "build"
git push

#git subtree push --prefix dist origin gh-pages

