name: Release and GitHub Pages

on:
  push:
    tags:
    - "v*"

jobs:
  build:

    runs-on: ubuntu-18.04

    steps:
    - uses: actions/checkout@v2

    - name: Use Node.js 12.x
      uses: actions/setup-node@v1
      with:
        node-version: 12.x

    - name: Install Dependencies
      run: |
        npm ci
        npm run fix-compatibility
    - name: Build Legacy
      run: |
        npm run build
        tar -czf legacy.tar.gz -C ./dist .
        zip -rJ9 legacy.zip ./dist
    - name: Build Modern
      run: |
        npm run build -- --modern
        tar -czf modern.tar.gz -C ./dist .
        zip -rJ9 modern.zip ./dist
    - run: sha256sum *.tar.gz *.zip > sha256sum.txt

    - name: Deploy
      uses: peaceiris/actions-gh-pages@v3
      with:
        github_token: ${{ secrets.GITHUB_TOKEN }}
        publish_dir: ./dist

    - name: Get current time
      id: date
      run: echo "::set-output name=date::$(date +'%Y/%m/%d')"

    - name: Create a Release
      id: create_release
      uses: actions/create-release@v1
      env:
        GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
      with:
        tag_name: ${{ github.ref }}
        release_name: "Build ${{ steps.date.outputs.date }}"
        draft: true

    - name: Upload Release Assets - legacy.tar.gz
      uses: actions/upload-release-asset@v1.0.2
      env:
        GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
      with:
        upload_url: ${{ steps.create_release.outputs.upload_url }}
        asset_path: ./legacy.tar.gz
        asset_name: legacy.tar.gz
        asset_content_type: application/gzip

    - name: Upload Release Assets - legacy.zip
      uses: actions/upload-release-asset@v1.0.2
      env:
        GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
      with:
        upload_url: ${{ steps.create_release.outputs.upload_url }}
        asset_path: ./legacy.zip
        asset_name: legacy.zip
        asset_content_type: application/zip

    - name: Upload Release Assets - modern.tar.gz
      uses: actions/upload-release-asset@v1.0.2
      env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
      with:
        upload_url: ${{ steps.create_release.outputs.upload_url }}
        asset_path: ./modern.tar.gz
        asset_name: modern.tar.gz
        asset_content_type: application/gzip

    - name: Upload Release Assets - modern.zip
      uses: actions/upload-release-asset@v1.0.2
      env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
      with:
        upload_url: ${{ steps.create_release.outputs.upload_url }}
        asset_path: ./modern.zip
        asset_name: modern.zip
        asset_content_type: application/zip

    - name: Upload Release Assets - sha256sum.txt
      uses: actions/upload-release-asset@v1.0.2
      env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
      with:
        upload_url: ${{ steps.create_release.outputs.upload_url }}
        asset_path: ./sha256sum.txt
        asset_name: sha256sum.txt
        asset_content_type: text/plain

