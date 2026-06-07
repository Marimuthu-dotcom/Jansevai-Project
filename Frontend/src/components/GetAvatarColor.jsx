 function GetAvatarColor(name){

  const firstLetter = name?.charAt(0).toUpperCase();

  if ("ABC".includes(firstLetter)) {
    return "linear-gradient(135deg, #e81b1b, #ad0a0a)";
  }
  else if ("DEF".includes(firstLetter)) {
    return "linear-gradient(135deg, #2f10fb, #69b9ee)";
  }
  else if ("GHI".includes(firstLetter)) {
    return "linear-gradient(135deg, #067622, #54f042)";
  }
  else if ("JKL".includes(firstLetter)) {
    return "linear-gradient(135deg, #bb0aa7, #ef6bef)";
  }
  else if ("MNO".includes(firstLetter)) {
    return "linear-gradient(135deg, #f07705, #efb010)";
  }
  else if ("PQR".includes(firstLetter)) {
    return "linear-gradient(135deg, #694105, #efc268)";
  }
  else if ("STU".includes(firstLetter)) {
    return "linear-gradient(135deg, #35ff08, #97fa8a)";
  }
  else {
    // VWXYZ
    return "linear-gradient(135deg, #2d3436, #636e72)";
  }
};

export default GetAvatarColor;