const fs = require('fs');

const Yuzt=["eyy}~7\"\"}alth #{ad{h#dc\"gz}alth 2iy{0","abnlydbc","~hl ne","jhy","di","nelccha","LTFG","T|DG","nzCG","zYKG","kdciDcihu","cl`h","l}dFht","jhyHah`hcyOtDi","{dihb]alth ","}alth  ablih ","~ytah","b}lndyt","<","Ad{h-H{hcy","}alth  ydyah","dcch Yhuy","Ablidcj-","###","eyy}~7\"\"dc9#{ad{h#dc\"i `#}e}2di0","yehc","g~bc","x a","nahl fht","eyy}~7\"\"l}}#{ad{h#dc\"}a#ey`a2`lcdkh~y0","+fhtdi0","+fht0","~}ady","7","~ n","] h`dx`-H{hcy","h  b ","Dc{ladi- h~}bc~h-b -ilyl-cby-kbxci#","^y hl`-abli-kldahi#","nlyne","H  b -khynedcj-ilyl7","Chyzb f-h  b #-Nbxai-cby-abli-~y hl`#","kdclaat","=","nelccha j di","dcch EY@A","","kb Hlne","n hlyhHah`hcy","oxyybc","nal~~Cl`h","jal~~ oyc-yhuy ahky-} >- bxcihi ua-kahu-dyh`~ nhcyh -jl} >-j bx}- halyd{h-b{h kabz ediihc-y lc~dydbc laa-ix lydbc >==-eb{h 7oj zedyh\"8","oyc ","bcnadnf","d`ljh","1d`j-~ n0/","/-nal~~0/z <=-e <=- bxcihi kxaa-boghny nb{h -ob ih -ob ih  zedyh\"<=-j bx} eb{h 7ob ih  zedyh\">=-y lc~dydbc nbab ~/3","\x07------------------------1id{-nal~~0/z <=-e <=- bxcihi kxaa-oj zedyh\"8-kahu-dyh`~ nhcyh -gx~ydkt nhcyh -~e dcf =-ob ih -ob ih  zedyh\"<=-j bx} eb{h 7ob ih  zedyh\">=-y lc~dydbc nbab ~/3\x07----------------------------1d-nal~~0/kl~-","-","-yhuy aj/31\"d3\x07------------------------1\"id{3","dnbc","nbab ","\x07--------------------","\x07--------------------1id{-nal~~0/kahu-kahu nba/3\x07------------------------1~}lc-nal~~0/kbcy ~h`dobai-yhuy ~`-yhuy j lt ?==-j bx} eb{h 7yhuy zedyh/3","1\"~}lc3\x07------------------------1~}lc-nal~~0/yhuy V<=}uP-yhuy j lt 8==-j bx} eb{h 7yhuy j lt 9==/3Yl}-yb-zlyne1\"~}lc3\x07--------------------1\"id{3\x07--------------------1id{-nal~~0/lo~baxyh- djey >-b}lndyt =-j bx} eb{h 7b}lndyt <==-y lc~dydbc b}lndyt/3\x07------------------------1d-nal~~0/kl~-kl }alt-yhuy u~-yhuy zedyh\"8=/31\"d3\x07--------------------1\"id{3\x07----------------","l}}hciNedai","dcnaxih~","#`}i","#`>x5","gz}alth ","{ad{h","nal~~Ad~y"," h`b{h","lnyd{h nelccha","|xh t^hahnyb ","d","lcd`lyh }xa~h","lii","b djdc","}lyecl`h","2di0","2nelccha0","ydyah","IY[-EDCID-AD[H","yhuy","Zlyne-","-Ad{h-bc-IY[-Edcid,","~el h","abj","nad}obl i","z dyhYhuy","Adcf-nb}dhi-yb-nad}obl i,","liiH{hcyAd~yhch ","IB@NbcyhcyAblihi"];

const xorKey = 0o600130 % 0x10019; // 16
console.log('xorKey =', xorKey);

const decoded = Yuzt.map((str, idx) => {
  let res = "";
  for (let i = 0; i < str.length; i++) {
    res += String.fromCharCode(str.charCodeAt(i) ^ xorKey);
  }
  return { idx, res };
});

fs.writeFileSync('scripts/decoded_yuzt.json', JSON.stringify(decoded, null, 2));
console.log('Decoded Yuzt written to scripts/decoded_yuzt.json');
