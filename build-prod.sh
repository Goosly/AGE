rm -r dist/*

npm run build-prod
git push origin --delete gh-pages

git add *
git commit -m "build"
git push

git subtree push --prefix dist origin gh-pages

#In case of an error on push, use force push:
#git push origin `git subtree split --prefix dist master`:gh-pages --force
