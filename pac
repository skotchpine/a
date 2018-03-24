#!/usr/bin/env bash

owd=$(pwd)

aur=https://aur.archlinux.org/
var=${PAC_VAR_DIR:?}
dir=${PAC_AUR_DIR:?}
usr=${PAC_USR_DIR:?}
url=${PAC_USR_URL:?}

suckoff() { echo ${1:-you lose}; cd $owd; exit 1; }

pacman_sync() {
  sudo pacman -S --noconfirm $@ > /dev/null \
    && echo "$@ installed" \
    || suckoff "no $@ from pacman"
}

pacman_drop() {
  sudo pacman -Rs --noconfirm $@ > /dev/null \
    && echo "$@ removed" \
    || suckoff "pacman keeps $@"
}

pacman_list() {
  pacman -Qte | cut -d' ' -f1
}

pacman_bak() {
  echo $(pacman_list) > $var/pac_bak \
    && echo "pac has bak" \
    || suckoff "no bak from pac"
}

pacman_kab() {
  if [[ -f $var/pac_bak ]]; then
    pacman_sync $(cat $var/pac_bak)
  else
    suckoff "no bak from pac"
  fi
}

aur_sync() {
  for pkg in $@; do
    cd $dir
    if [[ -d $pkg ]]; then
      git clone $aur/$pkg > /dev/null \
        || suckoff "no $pkg in aur"
    else
      git pull || suckoff "you git pull"
    fi

    cd $pkg
    makepkg -s || suckoff "you make $pkg"

    sudo pacman -U --noconfirm $pkg-*pkg* > /dev/null \
      || suckoff "you pac $pkg"

    cd $owd
  done
}

aur_drop() {
  for pkg in $@; do
    cd $dir

    pacman_drop $pkg > /dev/null \
      || suckoff "you drop $pkg"

    sudo rm -r $pkg \
      || suckoff "rmdir $pkg"

    cd $owd
  done
}

aur_list() {
  for pkg in $dir/*; do
    echo $pkg
  done
}

aur_bak() {
  echo $(aur_list) > $var/aur_bak \
    && echo "aur has bak" \
    || suckoff "no bak from aur"
}

aur_kab() {
  if [[ -f $var/aur_bak ]]; then
    aurman_sync $(cat $var/aur_bak)
  else
    suckoff "no bak from aur"
  fi
}

usr_sync() {
  for pkg in $@; do
    cd $usr
    if [[ -d $pkg ]]; then
      git clone $url/$pkg > /dev/null \
        || suckoff "no $pkg in usr"
    else
      git pull || suckoff "you git pull"
    fi

    cd $pkg
    makepkg -s || suckoff "you make $pkg"

    sudo pacman -U --noconfirm $pkg-*pkg* > /dev/null \
      || suckoff "you pac $pkg"

    cd $owd
  done
}

usr_drop() {
  for pkg in $@; do
    cd $usr

    pacman_drop $pkg > /dev/null \
      || suckoff "you drop $pkg"

    sudo rm -r $pkg \
      || suckoff "rmdir $pkg"

    cd $owd
  done
}

usr_list() {
  for pkg in $usr/*; do
    echo $pkg
  done
}

usr_bak() {
  echo $(usr_list) > $var/usr_bak \
    && echo "usr has bak" \
    || suckoff "no bak from usr"
}

usr_kab() {
  if [[ -f $var/usr_bak ]]; then
    usrman_sync $(cat $var/usr_bak)
  else
    suckoff "no bak from usr"
  fi
}

usage() { echo "
  pac <src> <cmd> <pkg> [<pkg>...]

  srcs:
    p pac
    a aur
    u usr

  cmds:
    l list
    s sync
    d drop
    b bak
    k kab

  cfgs:
    PAC_VAR_DIR
    PAC_AUR_DIR
    PAC_USR_DIR
    PAC_USR_URL
"; exit 0; }

case $2 in
  list|l) cmd=list ;;
  sync|s) cmd=sync ;;
  drop|d) cmd=drop ;;
  bak|b) cmd=bak ;;
  kab|k) cmd=kab ;;
  *) suckoff ;;
esac

case $1 in
  usage|help|h|u) usage ;;
  pac|p) pac_$cmd $@ ;;
  aur|a) aur_$cmd $@ ;;
  usr|u) usr_$cmd $@ ;;
  *) suckoff ;;
esac
