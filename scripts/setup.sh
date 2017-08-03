pwd=`pwd`
source="$pwd/$1"
destination="/etc/systemd/system/$1"
cp "$source" "$destination"
systemctl daemon-reload
systemctl enable "$2"
systemctl start "$2"
kill -9 $(lsof -t -i:"$3")
