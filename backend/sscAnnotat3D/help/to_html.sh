#!/usr/bin/env bash

BASEDIR=$(dirname "$0")
files=`ls $BASEDIR/*.md ../../COPYING`
echo $files

for file in $files
do
   printf "$file ..."
   pandoc $file --template=GitHub.html5 > $file.html
   sed -i  's/.md/.md.html/g' $file.html
   printf " OK\n"
done

mv ../../COPYING.html .
