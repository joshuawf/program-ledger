import React, { useState, useMemo, useEffect } from "react";
import { supabase, supabaseEnabled } from "./supabaseClient.js";


const RAW = [{"l":"Savannah","p":"Advertising and Branding","d":"MFA","e":[10,18,24,12,6],"founded":"Pre-2010"},{"l":"Atlanta","p":"Fashion","d":"BFA","e":[203,213,249,257,278],"g":[40,30,52,48,48,3],"founded":"Pre-2010"},{"l":"SCADnow","p":"Fashion","d":"MFA","g":[1,2,3,1,0,1],"founded":null},{"l":"Savannah","p":"Advertising","d":"MA","g":[0,0,1,0,0,0],"founded":null},{"l":"Atlanta","p":"Interactive Dsgn/Game Developm","d":"BA","e":[0,0,0,0,7],"founded":"Fall 2024 "},{"l":"Savannah","p":"Themed Entertainment Design","d":"MFA","e":[41,35,43,40,41],"g":[16,17,18,15,18,2],"founded":"Fall 2012"},{"l":"Savannah","p":"Industrial Design","d":"MA","e":[37,22,21,33,30],"g":[33,16,15,21,16,12],"founded":"Pre-2010"},{"l":"Savannah","p":"Social Strategy and Management","d":"BFA","e":[37,52,68,70,64],"g":[3,13,11,17,16,3],"founded":"Fall 2018"},{"l":"SCADnow","p":"Service Design","d":"MFA","g":[0,1,0,1,0,0],"founded":null},{"l":"Savannah","p":"Photography","d":"MFA","e":[23,13,18,19,23],"g":[1,11,5,3,4,4],"founded":"Pre-2010"},{"l":"Atlanta","p":"Fashion","d":"MA","g":[7,6,4,4,2,1],"founded":null},{"l":"Atlanta","p":"Illustration","d":"MFA","e":[47,39,41,45,49],"g":[15,17,8,9,6,12],"founded":"Pre-2010"},{"l":"Savannah","p":"Motion Media Design","d":"BFA","e":[131,112,107,103,121],"g":[39,44,29,38,27,4],"founded":"Pre-2010"},{"l":"Atlanta","p":"Industrial Design","d":"BFA","e":[28,47,42,41,66],"g":[0,8,12,2,12,0],"founded":"Summer 2011"},{"l":"Savannah","p":"Sequential Art","d":"MA","e":[4,6,6,8,11],"g":[1,2,1,4,5,5],"founded":"Pre-2010"},{"l":"Atlanta","p":"Dramatic Writing","d":"BFA","e":[1,1,4,20,32],"g":[0,0,0,1,3,2],"founded":"Pre-2010"},{"l":"Savannah","p":"Architectural History","d":"MFA","e":[4,4,2,6,3],"g":[3,1,1,2,0,1],"founded":"Pre-2010"},{"l":"Savannah","p":"Visual Effects","d":"BFA","e":[148,129,144,162,175],"g":[55,48,37,30,38,3],"founded":"Pre-2010"},{"l":"Savannah","p":"Service Design","d":"MA","e":[2,8,23,35,37],"g":[1,2,8,21,20,15],"founded":"Summer 2020"},{"l":"Savannah","p":"Jewelry","d":"BFA","e":[61,59,76,116,135],"g":[19,14,8,18,18,1],"founded":"Pre-2010"},{"l":"Atlanta","p":"Sequential Art","d":"BFA","e":[54,60,71,73,82],"g":[14,9,10,14,11,4],"founded":"Pre-2010"},{"l":"Savannah","p":"Graphic Dsgn/Visual Experience","d":"BFA","e":[413,444,408,442,460],"founded":"Pre-2010"},{"l":"Savannah","p":"Cinematography ","d":"MA","e":[0,0,0,0,4],"founded":"Fall 2024 "},{"l":"Savannah","p":"Illustration","d":"BFA","e":[741,853,967,1103,1098],"g":[155,200,200,221,237,52],"founded":"Pre-2010"},{"l":"Atlanta","p":"Interactive Dsgn/Game Developm","d":"MFA","e":[0,0,0,1,7],"g":[0,0,0,0,0,1],"founded":"Pre-2010"},{"l":"Savannah","p":"User Experience Research","d":"MFA","e":[0,0,0,0,0],"founded":null},{"l":"Savannah","p":"Design Management","d":"MA","e":[31,31,41,44,38],"g":[24,21,30,19,34,16],"founded":"Pre-2010"},{"l":"Savannah","p":"Advertising and Branding","d":"BFA","e":[239,189,175,167,170],"g":[80,72,54,44,41,4],"founded":"Pre-2010"},{"l":"Savannah","p":"Production Design","d":"MFA","e":[21,24,21,23,25],"g":[5,6,11,8,11,2],"founded":"Pre-2010"},{"l":"Savannah","p":"Art History","d":"BFA","e":[42,43,51,61,75],"g":[10,11,12,13,16,0],"founded":"Pre-2010"},{"l":"SCADnow","p":"Fashion","d":"BFA","g":[0,0,1,0,1,0],"founded":null},{"l":"Savannah","p":"Equestrian Studies","d":"BA","e":[33,36,26,35,34],"g":[10,9,7,6,4,1],"founded":"Pre-2010"},{"l":"Savannah","p":"Themed Entertainment Design","d":"BFA","e":[0,0,0,0,0],"founded":"Fall 2025"},{"l":"SCADnow","p":"Design for Sustainability","d":"MA","e":[0,1,1,2,5],"g":[0,0,0,1,1,3],"founded":"Winter 2022"},{"l":"Savannah","p":"Illustration","d":"MA","e":[12,13,19,27,24],"g":[7,6,4,16,15,6],"founded":"Pre-2010"},{"l":"Savannah","p":"Furniture Design","d":"MA","e":[2,9,5,6,3],"g":[4,6,9,8,3,1],"founded":"Pre-2010"},{"l":"Atlanta","p":"Luxury & Brand Management","d":"MA","e":[24,18,32,47,35],"founded":"Pre-2010"},{"l":"SCADnow","p":"Painting","d":"MFA","e":[67,70,82,80,84],"g":[14,17,12,11,24,11],"founded":"Pre-2010"},{"l":"Savannah","p":"Photography","d":"BFA","e":[284,256,231,238,238],"g":[79,77,60,59,50,14],"founded":"Pre-2010"},{"l":"Atlanta","p":"Illustration","d":"BFA","e":[141,148,186,213,238],"g":[30,26,30,48,40,13],"founded":"Pre-2010"},{"l":"Atlanta","p":"Graphic Dsgn/Visual Experience","d":"BA","e":[0,0,6,17,21],"founded":"Fall 2022"},{"l":"Atlanta","p":"Sequential Art","d":"BA","e":[0,0,2,5,2],"founded":"Winter 2023"},{"l":"Savannah","p":"Graphic Dsgn/Visual Experience","d":"BA","e":[0,0,9,18,46],"founded":"Fall 2022"},{"l":"Savannah","p":"Architectural History","d":"BFA","e":[6,5,5,5,3],"g":[0,1,1,1,3,0],"founded":"Pre-2010"},{"l":"SCADnow","p":"Interior Design","d":"MA","e":[19,25,12,12,13],"g":[8,11,10,6,3,2],"founded":"Pre-2010"},{"l":"Atlanta","p":"Painting","d":"MA","g":[0,0,0,0,1,0],"founded":null},{"l":"Savannah","p":"Graphic Design","d":"BA","g":[0,0,0,0,6,2],"founded":null},{"l":"Atlanta","p":"Film and Television","d":"MA","g":[13,7,17,14,16,4],"founded":null},{"l":"Atlanta","p":"Luxury and Brand Management","d":"MFA","g":[5,6,6,7,5,2],"founded":null},{"l":"Savannah","p":"Writing","d":"MFA","e":[16,11,11,8,10],"g":[4,7,1,3,2,0],"founded":"Pre-2010"},{"l":"Atlanta","p":"Fashion Marketing & Management","d":"BFA","e":[109,115,109,135,133],"g":[33,22,33,26,22,13],"founded":"Pre-2010"},{"l":"Atlanta","p":"Advertising and Branding","d":"BA","e":[0,0,4,7,11],"g":[0,0,0,0,0,1],"founded":"Fall 2022"},{"l":"Savannah","p":"Design for Sustainability","d":"MFA","e":[13,21,24,22,17],"g":[5,4,7,7,6,3],"founded":"Winter 2016"},{"l":"Savannah","p":"Interior Design","d":"MFA","e":[49,62,59,50,43],"g":[17,23,18,23,20,3],"founded":"Pre-2010"},{"l":"Atlanta","p":"Interactive Dsgn/Game Developm","d":"BFA","e":[72,69,87,104,100],"g":[14,11,21,17,18,4],"founded":"Pre-2010"},{"l":"Savannah","p":"User Experience Research","d":"BFA","e":[0,0,1,4,5],"g":[0,0,0,0,0,1],"founded":"Winter 2023"},{"l":"Savannah","p":"Service Design","d":"MBI","e":[0,0,0,0,21],"founded":"Fall 2024 "},{"l":"SCADnow","p":"Interactive Dsgn/Game Developm","d":"MFA","e":[14,20,21,23,18],"g":[2,4,3,5,3,0],"founded":"Pre-2010"},{"l":"Atlanta","p":"Sound Design","d":"BFA","e":[0,0,1,2,19],"g":[0,0,1,1,1,1],"founded":"Pre-2010"},{"l":"Savannah","p":"Production Design","d":"BFA","e":[247,271,320,340,377],"g":[65,52,76,74,79,14],"founded":"Pre-2010"},{"l":"Savannah","p":"Fashion","d":"MFA","e":[25,20,21,27,21],"g":[8,6,5,4,15,1],"founded":"Pre-2010"},{"l":"Savannah","p":"Sneaker Design","d":"MFA","e":[0,0,0,0,2],"founded":"Spring 2024"},{"l":"Savannah","p":"Applied AI","d":"BDES","e":[0,0,0,0,0],"founded":"Fall 2025"},{"l":"Atlanta","p":"Illustration","d":"BA","e":[0,0,3,16,17],"g":[0,0,0,0,1,1],"founded":"Fall 2022"},{"l":"Atlanta","p":"Photography","d":"BA","e":[0,0,2,7,8],"g":[0,0,0,0,1,1],"founded":"Winter 2023"},{"l":"Savannah","p":"Interactive Dsgn/Game Developm","d":"MA","e":[32,30,38,75,82],"g":[18,22,12,30,41,42],"founded":"Pre-2010"},{"l":"Savannah","p":"Fibers","d":"MA","e":[1,7,4,5,6],"g":[4,2,5,3,6,3],"founded":"Pre-2010"},{"l":"Atlanta","p":"Visual Effects","d":"MFA","e":[4,5,12,19,20],"g":[0,2,0,0,1,2],"founded":"Pre-2010"},{"l":"SCADnow","p":"Luxury & Brand Management","d":"MA","e":[29,23,27,25,24],"founded":"Fall 2013"},{"l":"SCADnow","p":"Animation","d":"MA","e":[11,14,15,13,14],"g":[2,4,3,4,11,2],"founded":"Winter 2015"},{"l":"Atlanta","p":"Graphic Dsgn/Visual Experience","d":"MFA","e":[20,26,33,22,25],"g":[0,8,4,2,6,3],"founded":"Pre-2010"},{"l":"Savannah","p":"Design Management","d":"MBI","e":[23,19,21,3,15],"g":[0,0,0,1,2,1],"founded":"Pre-2010"},{"l":"SCADnow","p":"Painting","d":"BFA","g":[1,0,0,0,1,0],"founded":null},{"l":"SCADnow","p":"Fibers","d":"BFA","g":[0,0,0,0,2,0],"founded":null},{"l":"Atlanta","p":"User Experience (UX) Design","d":"BFA","e":[23,27,43,53,56],"g":[0,3,7,4,7,6],"founded":"Spring 2017"},{"l":"SCADnow","p":"Sequential Art","d":"BA","e":[0,0,9,14,10],"g":[0,0,0,0,2,0],"founded":"Fall 2022"},{"l":"Savannah","p":"Luxury and Brand Management","d":"MA","e":[21,30,28,31,34],"g":[11,16,26,21,23,11],"founded":"Pre-2010"},{"l":"Savannah","p":"Editing","d":"MA","g":[0,0,0,0,2,1],"founded":null},{"l":"Atlanta","p":"Motion Media Design","d":"MFA","e":[18,12,8,12,18],"g":[8,6,2,3,1,5],"founded":"Pre-2010"},{"l":"Savannah","p":"Creative Business Leadership","d":"MA","e":[18,18,19,21,21],"g":[11,11,18,15,16,2],"founded":"Pre-2010"},{"l":"Savannah","p":"User Experience (UX) Design","d":"BFA","e":[155,149,141,171,199],"g":[42,47,40,26,38,8],"founded":"Fall 2015"},{"l":"SCADnow","p":"Painting","d":"MA","g":[0,0,0,1,0,0],"founded":null},{"l":"Atlanta","p":"Advertising and Branding","d":"MFA","e":[17,31,31,27,20],"founded":"Pre-2010"},{"l":"Savannah","p":"Writing","d":"BFA","e":[71,76,93,107,122],"g":[24,12,18,24,27,9],"founded":"Pre-2010"},{"l":"Atlanta","p":"Advertising","d":"MA","g":[10,16,29,23,30,13],"founded":null},{"l":"SCADnow","p":"Fashion Marketing & Management","d":"BFA","e":[1,24,30,33,50],"g":[0,2,1,6,7,3],"founded":"Pre-2010"},{"l":"Savannah","p":"Sound Design","d":"MA","e":[2,9,6,6,7],"g":[2,6,5,6,6,0],"founded":"Pre-2010"},{"l":"Savannah","p":"Interior Design","d":"BFA","e":[497,521,536,567,572],"g":[109,110,124,116,120,38],"founded":"Pre-2010"},{"l":"SCADnow","p":"Graphic Dsgn/Visual Experience","d":"MFA","e":[20,33,32,32,26],"g":[2,2,3,9,8,1],"founded":"Pre-2010"},{"l":"Savannah","p":"Preservation Design","d":"MFA","g":[0,1,1,3,2,0],"founded":null},{"l":"SCADnow","p":"Interactive Dsgn/Game Developm","d":"BFA","e":[1,4,5,4,2],"g":[0,0,0,0,1,1],"founded":"Pre-2010"},{"l":"SCADnow","p":"Sound Design","d":"BFA","g":[0,0,0,0,1,0],"founded":null},{"l":"Atlanta","p":"Photography","d":"MFA","e":[18,25,17,19,25],"g":[3,8,1,8,6,2],"founded":"Pre-2010"},{"l":"Atlanta","p":"Animation","d":"MFA","e":[48,43,45,50,53],"g":[11,11,12,7,10,8],"founded":"Pre-2010"},{"l":"Atlanta","p":"Creative Business Leadership","d":"MA","e":[21,19,13,16,23],"g":[9,8,6,10,11,7],"founded":"Pre-2010"},{"l":"Savannah","p":"Fashion","d":"BFA","e":[510,523,620,715,713],"g":[111,114,119,112,103,2],"founded":"Pre-2010"},{"l":"Savannah","p":"Animation","d":"MFA","e":[149,124,142,140,149],"g":[45,36,28,40,40,24],"founded":"Pre-2010"},{"l":"Savannah","p":"Design for Sustainability","d":"MA","e":[10,16,20,14,8],"g":[3,13,11,15,13,2],"founded":"Pre-2010"},{"l":"SCADnow","p":"Illustration","d":"BA","g":[0,0,0,0,1,1],"founded":null},{"l":"Savannah","p":"Interior Design","d":"MA","e":[9,6,7,3,1],"g":[7,7,6,5,2,0],"founded":"Pre-2010"},{"l":"Atlanta","p":"Visual Effects","d":"BFA","e":[24,20,23,30,30],"g":[10,2,4,5,9,1],"founded":"Pre-2010"},{"l":"SCADnow","p":"Business of Beauty & Fragrance","d":"BFA","g":[0,0,0,2,2,1],"founded":null},{"l":"Atlanta","p":"Graphic Dsgn/Visual Experience","d":"BFA","e":[128,126,108,143,154],"founded":"Pre-2010"},{"l":"Savannah","p":"Accessory Design","d":"MFA","g":[1,3,1,2,0,0],"founded":null},{"l":"Savannah","p":"Painting","d":"MFA","e":[30,26,27,27,30],"g":[12,7,12,6,6,2],"founded":"Pre-2010"},{"l":"Savannah","p":"Motion Media Design","d":"MA","e":[14,21,24,25,23],"g":[11,13,22,15,21,8],"founded":"Pre-2010"},{"l":"Atlanta","p":"Cinematography","d":"MA","g":[0,0,0,0,2,0],"founded":null},{"l":"Savannah","p":"Editing ","d":"MA","e":[0,0,0,0,2],"founded":"Fall 2024 "},{"l":"SCADnow","p":"Advertising","d":"BFA","g":[0,1,0,0,0,0],"founded":null},{"l":"Savannah","p":"Graphic Design","d":"BFA","g":[68,111,129,91,95,26],"founded":null},{"l":"Savannah","p":"Visual Effects","d":"MA","e":[17,16,10,26,37],"g":[12,11,11,11,12,6],"founded":"Pre-2010"},{"l":"Atlanta","p":"Motion Media Design","d":"BFA","e":[28,23,21,23,26],"g":[11,6,10,5,4,3],"founded":"Pre-2010"},{"l":"SCADnow","p":"Motion Media Design","d":"MFA","e":[3,13,12,13,14],"g":[1,0,1,3,2,0],"founded":"Fall 2011"},{"l":"Savannah","p":"Jewelry","d":"MA","e":[5,4,0,8,11],"g":[3,2,2,2,6,1],"founded":"Pre-2010"},{"l":"Atlanta","p":"Graphic Dsgn/Visual Experience","d":"MA","e":[27,17,17,32,13],"g":[13,12,9,29,1,5],"founded":"Pre-2010"},{"l":"Atlanta","p":"Advertising and Branding","d":"BFA","e":[63,53,54,65,69],"g":[18,7,17,17,12,3],"founded":"Pre-2010"},{"l":"Savannah","p":"Graphic Dsgn/Visual Experience","d":"MA","e":[14,25,22,27,21],"g":[6,10,11,15,12,11],"founded":"Pre-2010"},{"l":"SCADnow","p":"Interactive Dsgn/Game Developm","d":"BA","e":[0,0,0,1,25],"founded":"Fall 2023"},{"l":"SCADnow","p":"Design Management","d":"MFA","e":[0,1,0,0,0],"founded":"Winter 2022"},{"l":"Savannah","p":"Creative Business Leadership","d":"MBI","e":[0,0,0,0,2],"founded":"Fall 2024 "},{"l":"SCADnow","p":"Graphic Dsgn/Visual Experience","d":"BFA","e":[164,182,178,136,113],"founded":"Pre-2010"},{"l":"Atlanta","p":"Cinematography ","d":"MA","e":[0,0,0,0,5],"founded":"Fall 2024 "},{"l":"Savannah","p":"Preservation Design","d":"BFA","g":[5,3,2,1,2,2],"founded":null},{"l":"Savannah","p":"Film and Television","d":"MFA","e":[76,73,66,67,68],"g":[27,18,27,29,16,9],"founded":"Pre-2010"},{"l":"Savannah","p":"Art History","d":"MA","e":[16,19,10,10,6],"g":[6,10,8,6,2,3],"founded":"Pre-2010"},{"l":"SCADnow","p":"Social Strategy and Management","d":"BFA","e":[0,7,8,17,12],"g":[0,1,0,3,2,4],"founded":"Summer 2019"},{"l":"Atlanta","p":"Graphic Design","d":"UGCERT","g":[0,2,1,0,0,0],"founded":null},{"l":"SCADnow","p":"Fashion","d":"MA","g":[0,0,0,0,1,0],"founded":null},{"l":"SCADnow","p":"Illustration","d":"MFA","e":[44,70,66,60,55],"g":[7,5,13,15,23,8],"founded":"Spring 2012"},{"l":"Atlanta","p":"Photography","d":"BFA","e":[81,66,73,71,69],"g":[16,20,26,13,19,5],"founded":"Pre-2010"},{"l":"SCADnow","p":"Photography","d":"MFA","e":[28,24,22,21,26],"g":[5,5,9,3,7,4],"founded":"Fall 2012"},{"l":"Savannah","p":"Animation","d":"BFA","e":[1134,1284,1453,1582,1515],"g":[245,277,277,318,349,15],"founded":"Pre-2010"},{"l":"Atlanta","p":"Design Management","d":"MA","g":[0,0,0,0,1,0],"founded":null},{"l":"SCADnow","p":"Dramatic Writing","d":"BFA","e":[0,1,4,12,26],"g":[0,0,0,0,1,3],"founded":"Summer 2012"},{"l":"SCADnow","p":"Service Design","d":"MA","e":[4,6,11,6,4],"g":[0,0,3,5,2,0],"founded":"Winter 2021"},{"l":"Savannah","p":"Photography","d":"MA","e":[7,3,3,5,5],"g":[7,1,2,1,6,0],"founded":"Pre-2010"},{"l":"Atlanta","p":"Illustration","d":"MA","e":[11,6,7,11,7],"g":[5,5,7,10,3,2],"founded":"Pre-2010"},{"l":"Atlanta","p":"Graphic Design","d":"BA","g":[0,0,0,1,3,0],"founded":null},{"l":"SCADnow","p":"Sequential Art","d":"BFA","e":[8,54,102,114,129],"g":[1,2,9,13,19,11],"founded":"Pre-2010"},{"l":"Savannah","p":"Accessory Design","d":"BFA","e":[36,45,53,55,66],"g":[6,11,9,12,16,1],"founded":"Pre-2010"},{"l":"Savannah","p":"Painting","d":"BFA","e":[104,132,181,205,229],"g":[30,28,28,32,41,8],"founded":"Pre-2010"},{"l":"Atlanta","p":"Writing","d":"MFA","e":[15,13,12,9,8],"g":[5,4,8,3,2,1],"founded":"Pre-2010"},{"l":"Savannah","p":"Advertising","d":"MFA","g":[2,3,5,11,1,2],"founded":null},{"l":"Savannah","p":"Acting","d":"MFA","e":[35,63,51,34,37],"g":[10,20,32,14,17,0],"founded":"Pre-2010"},{"l":"SCADnow","p":"Motion Media Design","d":"BFA","g":[0,0,0,0,1,0],"founded":null},{"l":"Savannah","p":"Industrial Design","d":"MFA","e":[93,94,83,68,47],"g":[13,19,25,16,21,7],"founded":"Pre-2010"},{"l":"SCADnow","p":"Graphic Dsgn/Visual Experience","d":"BA","e":[0,0,12,23,27],"founded":"Fall 2022"},{"l":"Atlanta","p":"Fashion","d":"MFA","e":[33,27,24,14,13],"g":[5,3,12,6,4,2],"founded":"Pre-2010"},{"l":"Savannah","p":"Sequential Art","d":"MFA","e":[32,29,37,38,44],"g":[12,9,12,11,18,1],"founded":"Pre-2010"},{"l":"SCADnow","p":"Preservation Design","d":"MA","g":[4,4,1,4,1,0],"founded":null},{"l":"Atlanta","p":"Interactive Dsgn/Game Developm","d":"MA","e":[0,0,1,0,2],"founded":"Pre-2010"},{"l":"Atlanta","p":"Acting","d":"BFA","e":[2,0,2,47,93],"g":[0,0,1,0,6,2],"founded":"Winter 2012"},{"l":"Savannah","p":"Production Design","d":"MA","e":[4,4,11,4,5],"g":[4,3,8,6,5,1],"founded":"Pre-2010"},{"l":"Savannah","p":"Film and Television","d":"BFA","e":[783,852,940,1091,1219],"g":[159,163,208,192,201,41],"founded":"Pre-2010"},{"l":"Atlanta","p":"Interior Design","d":"MFA","e":[55,41,37,32,22],"g":[17,22,8,16,12,1],"founded":"Pre-2010"},{"l":"SCADnow","p":"Illustration","d":"BFA","g":[0,1,0,0,0,1],"founded":null},{"l":"Savannah","p":"Service Design","d":"MFA","e":[31,35,55,66,29],"g":[5,11,8,11,22,6],"founded":"Winter 2012"},{"l":"SCADnow","p":"Photography","d":"BFA","e":[8,23,20,22,25],"g":[3,4,3,6,5,4],"founded":"Pre-2010"},{"l":"SCADnow","p":"Design Management","d":"MA","e":[51,35,29,26,27],"g":[17,19,13,10,12,4],"founded":"Fall 2011"},{"l":"Savannah","p":"Dramatic Writing","d":"MFA","e":[26,30,30,23,19],"g":[10,15,13,14,7,1],"founded":"Pre-2010"},{"l":"Savannah","p":"Immersive Reality","d":"BFA","e":[23,28,41,48,47],"g":[1,7,6,11,11,1],"founded":"Winter 2019"},{"l":"SCADnow","p":"Luxury and Brand Management","d":"MFA","g":[1,2,5,3,6,0],"founded":null},{"l":"Savannah","p":"Design Management","d":"MFA","e":[0,0,0,22,16],"g":[3,7,4,2,9,6],"founded":"Winter 2024"},{"l":"Atlanta","p":"Writing","d":"BFA","e":[28,28,28,29,31],"g":[10,7,5,3,5,2],"founded":"Pre-2010"},{"l":"SCADnow","p":"Advertising and Branding","d":"BA","e":[0,0,3,5,12],"g":[0,0,0,0,1,5],"founded":"Fall 2022"},{"l":"Savannah","p":"Advertising","d":"BFA","g":[0,1,0,0,0,0],"founded":null},{"l":"Savannah","p":"Acting","d":"BFA","e":[289,372,425,474,488],"g":[42,81,94,83,78,9],"founded":"Pre-2010"},{"l":"SCADnow","p":"Design for Sustainability","d":"MFA","e":[0,1,0,6,8],"g":[0,0,0,0,1,0],"founded":"Winter 2022"},{"l":"SCADnow","p":"Service Design","d":"MBI","e":[0,0,0,0,0],"founded":"Summer 2025"},{"l":"Savannah","p":"Illustration","d":"MFA","e":[107,115,117,126,116],"g":[27,23,33,33,34,28],"founded":"Pre-2010"},{"l":"Savannah","p":"Furniture Design","d":"MFA","e":[14,8,15,11,8],"g":[9,3,2,3,6,0],"founded":"Pre-2010"},{"l":"Atlanta","p":"Luxury and Brand Management","d":"MA","g":[26,7,21,25,15,14],"founded":null},{"l":"Savannah","p":"Industrial Design","d":"BFA","e":[274,253,249,266,291],"g":[71,68,94,49,57,9],"founded":"Pre-2010"},{"l":"Atlanta","p":"Luxury & Brand Management","d":"MFA","e":[25,24,23,20,25],"founded":"Pre-2010"},{"l":"Savannah","p":"Interactive Dsgn/Game Developm","d":"BA","e":[0,0,1,1,19],"founded":"Winter 2023"},{"l":"SCADnow","p":"Photography","d":"BA","e":[0,0,1,2,5],"g":[0,0,0,0,0,1],"founded":"Fall 2022"},{"l":"Savannah","p":"Sequential Art","d":"BFA","e":[427,493,540,639,722],"g":[76,126,117,108,147,33],"founded":"Pre-2010"},{"l":"SCADnow","p":"Interactive Dsgn/Game Developm","d":"MA","e":[7,11,11,20,20],"g":[4,3,1,4,13,3],"founded":"Pre-2010"},{"l":"Savannah","p":"Fashion","d":"MA","e":[4,8,11,12,7],"g":[2,4,2,10,3,1],"founded":"Pre-2010"},{"l":"Savannah","p":"Sneaker Design","d":"MA","e":[0,0,0,1,5],"g":[0,0,0,0,0,4],"founded":"Winter 2024"},{"l":"Atlanta","p":"Interior Design","d":"BFA","e":[162,155,183,184,179],"g":[33,34,38,42,35,29],"founded":"Pre-2010"},{"l":"Atlanta","p":"Painting","d":"MFA","e":[10,10,15,18,15],"g":[3,2,6,2,2,1],"founded":"Pre-2010"},{"l":"Savannah","p":"Service Design","d":"BFA","e":[23,20,19,26,37],"g":[11,7,7,2,7,0],"founded":"Pre-2010"},{"l":"Atlanta","p":"Film and Television","d":"MFA","e":[108,108,104,78,83],"g":[19,32,29,24,22,15],"founded":"Summer 2011"},{"l":"Atlanta","p":"Graphic Design","d":"BFA","g":[36,31,26,29,36,7],"founded":null},{"l":"Savannah","p":"Architecture","d":"MARCH","e":[51,57,77,63,60],"g":[25,15,30,30,23,0],"founded":"Pre-2010"},{"l":"Atlanta","p":"Visual Effects","d":"MA","e":[0,0,0,0,3],"g":[0,0,0,0,1,0],"founded":"Pre-2010"},{"l":"Atlanta","p":"Interior Design","d":"MA","e":[10,13,9,4,3],"g":[4,8,9,4,2,0],"founded":"Pre-2010"},{"l":"Savannah","p":"Dramatic Writing","d":"BFA","e":[135,157,152,174,188],"g":[27,45,54,33,40,7],"founded":"Pre-2010"},{"l":"Savannah","p":"Cinematography","d":"MA","g":[0,0,0,0,1,2],"founded":null},{"l":"SCADnow","p":"Design Management","d":"MBI","e":[0,0,0,0,6],"founded":"Fall 2024"},{"l":"Atlanta","p":"Motion Media Design","d":"MA","e":[0,1,0,0,1],"g":[0,0,0,0,0,3],"founded":"Pre-2010"},{"l":"Atlanta","p":"Editing ","d":"MA","e":[0,0,0,0,3],"founded":"Fall 2024 "},{"l":"Savannah","p":"Interactive Dsgn/Game Developm","d":"MFA","e":[75,80,82,114,164],"g":[12,20,24,19,14,15],"founded":"Pre-2010"},{"l":"Atlanta","p":"Advertising and Branding","d":"MA","e":[20,34,34,37,37],"founded":"Pre-2010"},{"l":"Savannah","p":"Furniture Design","d":"BFA","e":[34,36,36,60,63],"g":[13,9,4,10,17,0],"founded":"Pre-2010"},{"l":"Savannah","p":"Sequential Art","d":"BA","e":[0,0,4,8,27],"g":[0,0,0,0,1,1],"founded":"Winter 2023"},{"l":"Savannah","p":"Architecture","d":"BFA","e":[279,313,323,366,410],"g":[48,67,72,60,69,0],"founded":"Pre-2010"},{"l":"SCADnow","p":"Luxury and Brand Management","d":"MA","g":[9,10,9,14,13,5],"founded":null},{"l":"Savannah","p":"Fibers","d":"MFA","e":[19,15,11,9,13],"g":[4,7,7,4,6,0],"founded":"Pre-2010"},{"l":"SCADnow","p":"Luxury & Brand Management","d":"MFA","e":[1,15,20,17,16],"founded":"Winter 2015"},{"l":"Atlanta","p":"Animation","d":"BFA","e":[302,327,364,439,442],"g":[71,69,84,63,96,20],"founded":"Pre-2010"},{"l":"SCADnow","p":"Animation","d":"MFA","e":[21,39,42,32,36],"g":[1,4,4,3,11,4],"founded":"Fall 2012"},{"l":"SCADnow","p":"Creative Business Leadership","d":"MA","e":[47,33,40,37,24],"g":[19,11,17,20,8,7],"founded":"Pre-2010"},{"l":"SCADnow","p":"Graphic Dsgn/Visual Experience","d":"MA","e":[12,12,15,14,24],"g":[2,5,11,6,9,6],"founded":"Pre-2010"},{"l":"Savannah","p":"Preservation Design","d":"MA","g":[2,4,2,2,0,0],"founded":null},{"l":"Savannah","p":"Luxury and Brand Management","d":"MFA","e":[32,35,34,24,29],"g":[7,12,11,15,8,1],"founded":"Pre-2010"},{"l":"SCADnow","p":"Visual Effects","d":"BFA","g":[0,0,0,0,1,0],"founded":null},{"l":"Savannah","p":"Fashion Marketing & Management","d":"BFA","e":[266,286,310,362,408],"g":[70,80,63,56,79,12],"founded":"Pre-2010"},{"l":"Atlanta","p":"Photography","d":"MA","g":[0,0,0,1,0,1],"founded":null},{"l":"Atlanta","p":"Animation","d":"MA","e":[0,0,0,0,2],"g":[0,0,0,0,1,0],"founded":"Pre-2010"},{"l":"Atlanta","p":"Creative Business Leadership","d":"MBI","e":[0,0,0,0,4],"founded":"Fall 2024 "},{"l":"SCADnow","p":"Interior Design","d":"BFA","g":[1,0,0,0,0,0],"founded":null},{"l":"Atlanta","p":"Painting","d":"BFA","e":[42,47,48,60,45],"g":[7,12,18,6,14,3],"founded":"Pre-2010"},{"l":"Atlanta","p":"Film and Television","d":"BFA","e":[275,300,357,375,383],"g":[48,62,64,73,76,32],"founded":"Pre-2010"},{"l":"Savannah","p":"Animation","d":"MA","e":[24,23,39,49,43],"g":[16,8,15,36,14,19],"founded":"Pre-2010"},{"l":"Atlanta","p":"Advertising","d":"MFA","g":[1,1,9,11,8,1],"founded":null},{"l":"Savannah","p":"Sound Design","d":"MFA","e":[22,26,29,27,26],"g":[10,8,18,7,9,5],"founded":"Pre-2010"},{"l":"SCADnow","p":"Graphic Design","d":"BFA","g":[44,33,48,41,34,16],"founded":null},{"l":"Savannah","p":"User Experience (UX) Design","d":"MFA","e":[0,0,0,7,65],"g":[0,0,0,0,1,4],"founded":"Winter 2024"},{"l":"SCADnow","p":"Visual Effects","d":"MA","g":[0,0,0,0,1,0],"founded":null},{"l":"Savannah","p":"Accessory Design","d":"MA","g":[1,0,2,0,0,0],"founded":null},{"l":"Savannah","p":"Painting","d":"MA","e":[4,2,3,2,0],"g":[3,1,1,2,0,0],"founded":"Pre-2010"},{"l":"Savannah","p":"Illustration","d":"BA","e":[0,0,8,29,44],"g":[0,0,0,0,0,3],"founded":"Fall 2022"},{"l":"SCADnow","p":"Advertising and Branding","d":"BFA","e":[6,13,16,26,26],"g":[1,0,4,7,4,2],"founded":"Spring 2011"},{"l":"Savannah","p":"Advertising and Branding","d":"BA","e":[0,0,6,25,29],"g":[0,0,0,2,5,1],"founded":"Fall 2022"},{"l":"SCADnow","p":"Motion Media Design","d":"MA","e":[7,7,5,8,11],"g":[3,4,3,4,2,3],"founded":"Pre-2010"},{"l":"Savannah","p":"Interactive Dsgn/Game Developm","d":"BFA","e":[343,355,347,405,440],"g":[90,102,90,63,84,12],"founded":"Pre-2010"},{"l":"SCADnow","p":"Graphic Design","d":"UGCERT","g":[4,2,3,0,1,1],"founded":null},{"l":"Savannah","p":"Fibers","d":"BFA","e":[131,131,121,141,134],"g":[46,44,40,34,38,1],"founded":"Pre-2010"},{"l":"SCADnow","p":"Animation","d":"BFA","g":[0,0,0,0,2,2],"founded":null},{"l":"Savannah","p":"Motion Media Design","d":"MFA","e":[26,35,27,28,48],"g":[1,4,7,4,6,6],"founded":"Pre-2010"},{"l":"Savannah","p":"Photography","d":"BA","e":[0,0,3,4,7],"founded":"Winter 2023"},{"l":"Atlanta","p":"Dramatic Writing","d":"MFA","e":[0,0,2,0,0],"founded":"Fall 2022"},{"l":"Savannah","p":"Film and Television","d":"MA","e":[7,13,11,15,9],"g":[9,12,5,12,9,1],"founded":"Pre-2010"},{"l":"Savannah","p":"Visual Effects","d":"MFA","e":[39,42,41,43,42],"g":[7,12,6,15,7,5],"founded":"Pre-2010"},{"l":"SCADnow","p":"Illustration","d":"MA","e":[20,30,27,27,22],"g":[6,13,8,17,14,4],"founded":"Pre-2010"},{"l":"Savannah","p":"Jewelry","d":"MFA","e":[16,16,14,13,12],"g":[4,6,1,5,4,0],"founded":"Pre-2010"},{"l":"SCADnow","p":"Graphic Design","d":"BA","g":[0,0,0,2,2,2],"founded":null},{"l":"SCADnow","p":"Photography","d":"MA","e":[7,7,9,8,6],"g":[8,4,6,3,4,0],"founded":"Pre-2010"},{"l":"Atlanta","p":"Sequential Art","d":"MFA","e":[8,8,6,12,14],"g":[3,6,1,1,6,2],"founded":"Pre-2010"},{"l":"SCADnow","p":"Creative Business Leadership","d":"MBI","e":[0,0,0,0,10],"founded":"Fall 2024"},{"l":"SCADnow","p":"Writing","d":"MFA","e":[24,22,24,23,29],"g":[7,2,7,5,8,2],"founded":"Fall 2013"},{"l":"Savannah","p":"Business of Beauty & Fragrance","d":"BFA","e":[78,114,134,142,141],"g":[9,19,34,25,42,1],"founded":"Fall 2018"},{"l":"SCADnow","p":"Film and Television","d":"BFA","g":[0,0,2,0,0,0],"founded":null},{"l":"Savannah","p":"Graphic Dsgn/Visual Experience","d":"MFA","e":[41,38,43,42,41],"g":[4,12,9,7,10,5],"founded":"Pre-2010"},{"l":"Atlanta","p":"Advertising","d":"BFA","g":[3,1,0,0,0,0],"founded":null},{"l":"Savannah","p":"Sound Design","d":"BFA","e":[134,147,170,210,219],"g":[36,35,31,41,53,12],"founded":"Pre-2010"},{"l":"Overall","p":"Advertising and Branding","d":"MFA","e":[27,49,55,39,26],"founded":"Pre-2010"},{"l":"Overall","p":"Fashion","d":"BFA","e":[713,736,869,972,991],"g":[151,144,172,160,152,5],"founded":"Pre-2010"},{"l":"Overall","p":"Fashion","d":"MFA","e":[58,47,45,41,34],"g":[14,11,20,11,19,4],"founded":"Pre-2010"},{"l":"Overall","p":"Advertising","d":"MA","g":[10,16,30,23,30,13],"founded":null},{"l":"Overall","p":"Interactive Dsgn/Game Developm","d":"BA","e":[0,0,1,2,51],"founded":null},{"l":"Overall","p":"Themed Entertainment Design","d":"MFA","e":[41,35,43,40,41],"g":[16,17,18,15,18,2],"founded":"Fall 2012"},{"l":"Overall","p":"Industrial Design","d":"MA","e":[37,22,21,33,30],"g":[33,16,15,21,16,12],"founded":"Pre-2010"},{"l":"Overall","p":"Social Strategy and Management","d":"BFA","e":[37,59,76,87,76],"g":[3,14,11,20,18,7],"founded":"Fall 2018"},{"l":"Overall","p":"Service Design","d":"MFA","e":[31,35,55,66,29],"g":[5,12,8,12,22,6],"founded":null},{"l":"Overall","p":"Photography","d":"MFA","e":[69,62,57,59,74],"g":[9,24,15,14,17,10],"founded":"Pre-2010"},{"l":"Overall","p":"Fashion","d":"MA","e":[4,8,11,12,7],"g":[9,10,6,14,6,2],"founded":"Pre-2010"},{"l":"Overall","p":"Illustration","d":"MFA","e":[198,224,224,231,220],"g":[49,45,54,57,63,48],"founded":"Pre-2010"},{"l":"Overall","p":"Motion Media Design","d":"BFA","e":[159,135,128,126,147],"g":[50,50,39,43,32,7],"founded":"Pre-2010"},{"l":"Overall","p":"Industrial Design","d":"BFA","e":[302,300,291,307,357],"g":[71,76,106,51,69,9],"founded":"Pre-2010"},{"l":"Overall","p":"Sequential Art","d":"MA","e":[4,6,6,8,11],"g":[1,2,1,4,5,5],"founded":"Pre-2010"},{"l":"Overall","p":"Dramatic Writing","d":"BFA","e":[136,159,160,206,246],"g":[27,45,54,34,44,12],"founded":"Pre-2010"},{"l":"Overall","p":"Architectural History","d":"MFA","e":[4,4,2,6,3],"g":[3,1,1,2,0,1],"founded":"Pre-2010"},{"l":"Overall","p":"Visual Effects","d":"BFA","e":[172,149,167,192,205],"g":[65,50,41,35,48,4],"founded":null},{"l":"Overall","p":"Service Design","d":"MA","e":[6,14,34,41,41],"g":[1,2,11,26,22,15],"founded":"Summer 2020"},{"l":"Overall","p":"Jewelry","d":"BFA","e":[61,59,76,116,135],"g":[19,14,8,18,18,1],"founded":"Pre-2010"},{"l":"Overall","p":"Sequential Art","d":"BFA","e":[489,607,713,826,933],"g":[91,137,136,135,177,48],"founded":"Pre-2010"},{"l":"Overall","p":"Graphic Dsgn/Visual Experience","d":"BFA","e":[705,752,694,721,727],"founded":"Pre-2010"},{"l":"Overall","p":"Cinematography ","d":"MA","e":[0,0,0,0,9],"founded":"Fall 2024 "},{"l":"Overall","p":"Illustration","d":"BFA","e":[882,1001,1153,1316,1336],"g":[185,227,230,269,277,66],"founded":"Pre-2010"},{"l":"Overall","p":"Interactive Dsgn/Game Developm","d":"MFA","e":[89,100,103,138,189],"g":[14,24,27,24,17,16],"founded":null},{"l":"Overall","p":"User Experience Research","d":"MFA","e":[0,0,0,0,0],"founded":null},{"l":"Overall","p":"Design Management","d":"MA","e":[82,66,70,70,65],"g":[41,40,43,29,47,20],"founded":"Pre-2010"},{"l":"Overall","p":"Advertising and Branding","d":"BFA","e":[308,255,245,258,265],"g":[99,79,75,68,57,9],"founded":"Pre-2010"},{"l":"Overall","p":"Production Design","d":"MFA","e":[21,24,21,23,25],"g":[5,6,11,8,11,2],"founded":"Pre-2010"},{"l":"Overall","p":"Art History","d":"BFA","e":[42,43,51,61,75],"g":[10,11,12,13,16,0],"founded":"Pre-2010"},{"l":"Overall","p":"Equestrian Studies","d":"BA","e":[33,36,26,35,34],"g":[10,9,7,6,4,1],"founded":"Pre-2010"},{"l":"Overall","p":"Themed Entertainment Design","d":"BFA","e":[0,0,0,0,0],"founded":"Fall 2025"},{"l":"Overall","p":"Design for Sustainability","d":"MA","e":[10,17,21,16,13],"g":[3,13,11,16,14,5],"founded":"Pre-2010"},{"l":"Overall","p":"Illustration","d":"MA","e":[43,49,53,65,53],"g":[18,24,19,43,32,12],"founded":"Pre-2010"},{"l":"Overall","p":"Furniture Design","d":"MA","e":[2,9,5,6,3],"g":[4,6,9,8,3,1],"founded":"Pre-2010"},{"l":"Overall","p":"Luxury & Brand Management","d":"MA","e":[53,41,59,72,59],"founded":null},{"l":"Overall","p":"Painting","d":"MFA","e":[107,106,124,125,129],"g":[29,26,30,19,32,14],"founded":"Pre-2010"},{"l":"Overall","p":"Photography","d":"BFA","e":[373,345,324,331,332],"g":[98,101,89,78,74,23],"founded":"Pre-2010"},{"l":"Overall","p":"Graphic Dsgn/Visual Experience","d":"BA","e":[0,0,27,58,94],"founded":"Fall 2022"},{"l":"Overall","p":"Sequential Art","d":"BA","e":[0,0,15,27,39],"g":[0,0,0,0,3,1],"founded":"Fall 2022"},{"l":"Overall","p":"Architectural History","d":"BFA","e":[6,5,5,5,3],"g":[0,1,1,1,3,0],"founded":"Pre-2010"},{"l":"Overall","p":"Interior Design","d":"MA","e":[38,44,28,19,17],"g":[19,26,25,15,7,2],"founded":"Pre-2010"},{"l":"Overall","p":"Painting","d":"MA","e":[4,2,3,2,0],"g":[3,1,1,3,1,0],"founded":"Pre-2010"},{"l":"Overall","p":"Graphic Design","d":"BA","g":[0,0,0,3,11,4],"founded":null},{"l":"Overall","p":"Film and Television","d":"MA","e":[7,13,11,15,9],"g":[22,19,22,26,25,5],"founded":"Pre-2010"},{"l":"Overall","p":"Luxury and Brand Management","d":"MFA","e":[32,35,34,24,29],"g":[13,20,22,25,19,3],"founded":"Pre-2010"},{"l":"Overall","p":"Writing","d":"MFA","e":[55,46,47,40,47],"g":[16,13,16,11,12,3],"founded":"Pre-2010"},{"l":"Overall","p":"Fashion Marketing & Management","d":"BFA","e":[376,425,449,530,591],"g":[103,104,97,88,108,28],"founded":"Pre-2010"},{"l":"Overall","p":"Advertising and Branding","d":"BA","e":[0,0,13,37,52],"g":[0,0,0,2,6,7],"founded":"Fall 2022"},{"l":"Overall","p":"Design for Sustainability","d":"MFA","e":[13,22,24,28,25],"g":[5,4,7,7,7,3],"founded":"Winter 2016"},{"l":"Overall","p":"Interior Design","d":"MFA","e":[104,103,96,82,65],"g":[34,45,26,39,32,4],"founded":"Pre-2010"},{"l":"Overall","p":"Interactive Dsgn/Game Developm","d":"BFA","e":[416,428,439,513,542],"g":[104,113,111,80,103,17],"founded":null},{"l":"Overall","p":"User Experience Research","d":"BFA","e":[0,0,1,4,5],"g":[0,0,0,0,0,1],"founded":"Winter 2023"},{"l":"Overall","p":"Service Design","d":"MBI","e":[0,0,0,0,21],"founded":"Fall 2024 "},{"l":"Overall","p":"Sound Design","d":"BFA","e":[134,147,171,212,238],"g":[36,35,32,42,55,13],"founded":"Pre-2010"},{"l":"Overall","p":"Production Design","d":"BFA","e":[247,271,320,340,377],"g":[65,52,76,74,79,14],"founded":"Pre-2010"},{"l":"Overall","p":"Sneaker Design","d":"MFA","e":[0,0,0,0,2],"founded":"Spring 2024"},{"l":"Overall","p":"Applied AI","d":"BDES","e":[0,0,0,0,0],"founded":"Fall 2025"},{"l":"Overall","p":"Illustration","d":"BA","e":[0,0,11,45,61],"g":[0,0,0,0,2,5],"founded":"Fall 2022"},{"l":"Overall","p":"Photography","d":"BA","e":[0,0,6,13,20],"g":[0,0,0,0,1,2],"founded":"Fall 2022"},{"l":"Overall","p":"Interactive Dsgn/Game Developm","d":"MA","e":[39,41,50,95,104],"g":[22,25,13,34,54,45],"founded":null},{"l":"Overall","p":"Fibers","d":"MA","e":[1,7,4,5,6],"g":[4,2,5,3,6,3],"founded":"Pre-2010"},{"l":"Overall","p":"Visual Effects","d":"MFA","e":[43,47,53,62,62],"g":[7,14,6,15,8,7],"founded":null},{"l":"Overall","p":"Animation","d":"MA","e":[35,37,54,62,59],"g":[18,12,18,40,26,21],"founded":"Pre-2010"},{"l":"Overall","p":"Graphic Dsgn/Visual Experience","d":"MFA","e":[81,97,108,96,92],"g":[6,22,16,18,24,9],"founded":"Pre-2010"},{"l":"Overall","p":"Design Management","d":"MBI","e":[23,19,21,3,21],"g":[0,0,0,1,2,1],"founded":"Pre-2010"},{"l":"Overall","p":"Painting","d":"BFA","e":[146,179,229,265,274],"g":[38,40,46,38,56,11],"founded":"Pre-2010"},{"l":"Overall","p":"Fibers","d":"BFA","e":[131,131,121,141,134],"g":[46,44,40,34,40,1],"founded":"Pre-2010"},{"l":"Overall","p":"User Experience (UX) Design","d":"BFA","e":[178,176,184,224,255],"g":[42,50,47,30,45,14],"founded":"Fall 2015"},{"l":"Overall","p":"Luxury and Brand Management","d":"MA","e":[21,30,28,31,34],"g":[46,33,56,60,51,30],"founded":"Pre-2010"},{"l":"Overall","p":"Editing","d":"MA","g":[0,0,0,0,2,1],"founded":null},{"l":"Overall","p":"Motion Media Design","d":"MFA","e":[47,60,47,53,80],"g":[10,10,10,10,9,11],"founded":"Pre-2010"},{"l":"Overall","p":"Creative Business Leadership","d":"MA","e":[86,70,72,74,68],"g":[39,30,41,45,35,16],"founded":"Pre-2010"},{"l":"Overall","p":"Writing","d":"BFA","e":[99,104,121,136,153],"g":[34,19,23,27,32,11],"founded":"Pre-2010"},{"l":"Overall","p":"Sound Design","d":"MA","e":[2,9,6,6,7],"g":[2,6,5,6,6,0],"founded":"Pre-2010"},{"l":"Overall","p":"Interior Design","d":"BFA","e":[659,676,719,751,751],"g":[143,144,162,158,155,67],"founded":"Pre-2010"},{"l":"Overall","p":"Preservation Design","d":"MFA","g":[0,1,1,3,2,0],"founded":null},{"l":"Overall","p":"Animation","d":"MFA","e":[218,206,229,222,238],"g":[57,51,44,50,61,36],"founded":"Pre-2010"},{"l":"Overall","p":"Business of Beauty & Fragrance","d":"BFA","e":[78,114,134,142,141],"g":[9,19,34,27,44,2],"founded":"Fall 2018"},{"l":"Overall","p":"Accessory Design","d":"MFA","g":[1,3,1,2,0,0],"founded":"Pre-2010"},{"l":"Overall","p":"Motion Media Design","d":"MA","e":[21,29,29,33,35],"g":[14,17,25,19,23,14],"founded":"Pre-2010"},{"l":"Overall","p":"Cinematography","d":"MA","g":[0,0,0,0,3,2],"founded":null},{"l":"Overall","p":"Editing ","d":"MA","e":[0,0,0,0,5],"founded":"Fall 2024 "},{"l":"Overall","p":"Advertising","d":"BFA","g":[3,3,0,0,0,0],"founded":null},{"l":"Overall","p":"Graphic Design","d":"BFA","g":[148,175,203,161,165,49],"founded":null},{"l":"Overall","p":"Visual Effects","d":"MA","e":[17,16,10,26,40],"g":[12,11,11,11,14,6],"founded":null},{"l":"Overall","p":"Jewelry","d":"MA","e":[5,4,0,8,11],"g":[3,2,2,2,6,1],"founded":"Pre-2010"},{"l":"Overall","p":"Graphic Dsgn/Visual Experience","d":"MA","e":[53,54,54,73,58],"g":[21,27,31,50,22,22],"founded":"Pre-2010"},{"l":"Overall","p":"Design Management","d":"MFA","e":[0,1,0,22,16],"g":[3,7,4,2,9,6],"founded":null},{"l":"Overall","p":"Creative Business Leadership","d":"MBI","e":[0,0,0,0,16],"founded":"Fall 2024 "},{"l":"Overall","p":"Preservation Design","d":"BFA","g":[5,3,2,1,2,2],"founded":null},{"l":"Overall","p":"Film and Television","d":"MFA","e":[184,181,170,145,151],"g":[46,50,56,53,38,24],"founded":"Pre-2010"},{"l":"Overall","p":"Art History","d":"MA","e":[16,19,10,10,6],"g":[6,10,8,6,2,3],"founded":"Pre-2010"},{"l":"Overall","p":"Graphic Design","d":"UGCERT","g":[4,4,4,0,1,1],"founded":null},{"l":"Overall","p":"Animation","d":"BFA","e":[1436,1611,1817,2021,1957],"g":[316,346,361,381,447,37],"founded":"Pre-2010"},{"l":"Overall","p":"Photography","d":"MA","e":[14,10,12,13,11],"g":[15,5,8,5,10,1],"founded":"Pre-2010"},{"l":"Overall","p":"Accessory Design","d":"BFA","e":[36,45,53,55,66],"g":[6,11,9,12,16,1],"founded":"Pre-2010"},{"l":"Overall","p":"Advertising","d":"MFA","g":[3,4,14,22,9,3],"founded":null},{"l":"Overall","p":"Acting","d":"MFA","e":[35,63,51,34,37],"g":[10,20,32,14,17,0],"founded":"Pre-2010"},{"l":"Overall","p":"Industrial Design","d":"MFA","e":[93,94,83,68,47],"g":[13,19,25,16,21,7],"founded":"Pre-2010"},{"l":"Overall","p":"Sequential Art","d":"MFA","e":[40,37,43,50,58],"g":[15,15,13,12,24,3],"founded":"Pre-2010"},{"l":"Overall","p":"Preservation Design","d":"MA","g":[6,8,3,6,1,0],"founded":null},{"l":"Overall","p":"Acting","d":"BFA","e":[291,372,427,521,581],"g":[42,81,95,83,84,11],"founded":"Pre-2010"},{"l":"Overall","p":"Production Design","d":"MA","e":[4,4,11,4,5],"g":[4,3,8,6,5,1],"founded":"Pre-2010"},{"l":"Overall","p":"Film and Television","d":"BFA","e":[1058,1152,1297,1466,1602],"g":[207,225,274,265,277,73],"founded":"Pre-2010"},{"l":"Overall","p":"Dramatic Writing","d":"MFA","e":[26,30,32,23,19],"g":[10,15,13,14,7,1],"founded":"Pre-2010"},{"l":"Overall","p":"Immersive Reality","d":"BFA","e":[23,28,41,48,47],"g":[1,7,6,11,11,1],"founded":"Winter 2019"},{"l":"Overall","p":"Furniture Design","d":"MFA","e":[14,8,15,11,8],"g":[9,3,2,3,6,0],"founded":"Pre-2010"},{"l":"Overall","p":"Luxury & Brand Management","d":"MFA","e":[26,39,43,37,41],"founded":null},{"l":"Overall","p":"Sneaker Design","d":"MA","e":[0,0,0,1,5],"g":[0,0,0,0,0,4],"founded":"Winter 2024"},{"l":"Overall","p":"Service Design","d":"BFA","e":[23,20,19,26,37],"g":[11,7,7,2,7,0],"founded":"Pre-2010"},{"l":"Overall","p":"Architecture","d":"MARCH","e":[51,57,77,63,60],"g":[25,15,30,30,23,0],"founded":"Pre-2010"},{"l":"Overall","p":"Advertising and Branding","d":"MA","e":[20,34,34,37,37],"founded":"Pre-2010"},{"l":"Overall","p":"Furniture Design","d":"BFA","e":[34,36,36,60,63],"g":[13,9,4,10,17,0],"founded":"Pre-2010"},{"l":"Overall","p":"Architecture","d":"BFA","e":[279,313,323,366,410],"g":[48,67,72,60,69,0],"founded":"Pre-2010"},{"l":"Overall","p":"Fibers","d":"MFA","e":[19,15,11,9,13],"g":[4,7,7,4,6,0],"founded":"Pre-2010"},{"l":"Overall","p":"Sound Design","d":"MFA","e":[22,26,29,27,26],"g":[10,8,18,7,9,5],"founded":"Pre-2010"},{"l":"Overall","p":"User Experience (UX) Design","d":"MFA","e":[0,0,0,7,65],"g":[0,0,0,0,1,4],"founded":"Winter 2024"},{"l":"Overall","p":"Accessory Design","d":"MA","g":[1,0,2,0,0,0],"founded":"Pre-2010"},{"l":"Overall","p":"Jewelry","d":"MFA","e":[16,16,14,13,12],"g":[4,6,1,5,4,0],"founded":"Pre-2010"}];

const LOCATIONS = ["Overall", "Savannah", "Atlanta", "SCADnow"];
const YEARS_E = ["W'21","W'22","W'23","W'24","W'25"];
const YEARS_G = ["'21","'22","'23","'24","'25","'26"];
const SMALL_COHORT_THRESHOLD = 5;

function avg(arr) {
  if (!arr || arr.length === 0) return null;
  return arr.reduce((a,b)=>a+b,0) / arr.length;
}

function percentile(sorted, p) {
  if (sorted.length === 0) return 0;
  const idx = (p/100) * (sorted.length - 1);
  const lo = Math.floor(idx), hi = Math.ceil(idx);
  if (lo === hi) return sorted[lo];
  return sorted[lo] + (sorted[hi]-sorted[lo]) * (idx-lo);
}

function enrAvg(r) { return r.e ? avg(r.e) : null; }
function gradAvg(r) { return r.g ? avg(r.g.slice(0,5)) : null; }

// Founding label is inferred from the first quarter (back to Fall 2010) with recorded
// enrollment for this exact program/degree/location. If enrollment already existed in the
// very first quarter on record (Fall 2010), we can't see further back, so it's labeled
// "Pre-2010" rather than treated as a real founding date.
function foundingText(founded) {
  if (!founded) return { short: 'Unknown', full: 'No enrollment history on record for this program/degree/location \u2014 founding date can\u2019t be inferred.' };
  if (founded === 'Pre-2010') return { short: 'Pre-2010', full: 'Enrolled students were already recorded in Fall 2010, the earliest quarter in the source data \u2014 so this program predates our records rather than being newly founded then.' };
  return { short: `Est. ${founded}`, full: `First recorded enrollment: ${founded} (earliest non-zero Winter/Fall/Spring/Summer quarter on record, back to Fall 2010).` };
}

function computeFlags(rows, legacyKeys) {
  const activeRows = rows.filter(r => !legacyKeys.has(rowKey(r)));
  const enrVals = activeRows.map(enrAvg).filter(v => v !== null && v > 0).sort((a,b)=>a-b);
  const gradVals = activeRows.map(gradAvg).filter(v => v !== null && v > 0).sort((a,b)=>a-b);
  const enrP10 = percentile(enrVals, 10);
  const gradP10 = percentile(gradVals, 10);

  // Denominator: how many programs of each degree type are present in this cohort.
  // A degree with very few programs (e.g. MBI) makes "bottom 10%" less meaningful —
  // flag that explicitly rather than let it look like an equally-confident signal.
  // Retired/legacy programs don't count toward this denominator either.
  const degreeCounts = {};
  activeRows.forEach(r => { degreeCounts[r.d] = (degreeCounts[r.d] || 0) + 1; });

  return rows.map(r => {
    const isRetired = legacyKeys.has(rowKey(r));
    const ea = enrAvg(r), ga = gradAvg(r);
    const flags = [];
    if (!isRetired) {
      if (ea !== null && ea > 0) {
        if (ea <= 10) flags.push({ code: 'E10', label: '\u226410 avg enrolled/qtr' });
        if (ea <= enrP10) flags.push({ code: 'EP10', label: 'bottom 10% enrollment' });
      }
      if (ga !== null && ga > 0) {
        if (ga <= 10) flags.push({ code: 'G10', label: '\u226410 avg graduates/yr' });
        if (ga <= gradP10) flags.push({ code: 'GP10', label: 'bottom 10% graduation' });
      }
    }
    const cohortSize = degreeCounts[r.d] || 0;
    const smallCohort = !isRetired && cohortSize <= SMALL_COHORT_THRESHOLD;
    return { ...r, enrAvgVal: ea, gradAvgVal: ga, flags, cohortSize, smallCohort, isRetired };
  });
}

// Unique identity for a program/degree/location row — used as the key for both
// retiring a program and linking it into another program's lineage.
function rowKey(r) { return `${r.l}|${r.p}|${r.d}`; }

function rowLabel(r) { return `${r.p} \u2014 ${r.d} (${r.l})`; }

// When the user records "Program A became Program B", we splice A's history into B:
// combine the two enrollment/graduation arrays, keep B's identity going forward, but
// use A's founding date since A is the older name. A is then removed from the ledger —
// its story continues under B.
function applyLineage(raw, lineage) {
  if (lineage.length === 0) return raw;
  const byKey = new Map(raw.map(r => [rowKey(r), { ...r }]));
  const removed = new Set();
  lineage.forEach(link => {
    const fromRow = byKey.get(link.fromKey);
    const toRow = byKey.get(link.toKey);
    if (!fromRow || !toRow || removed.has(link.fromKey)) return;
    if (fromRow.e || toRow.e) {
      const a = fromRow.e || [0,0,0,0,0];
      const b = toRow.e || [0,0,0,0,0];
      toRow.e = a.map((v,i) => (v||0) + (b[i]||0));
    }
    if (fromRow.g || toRow.g) {
      const a = fromRow.g || [0,0,0,0,0,0];
      const b = toRow.g || [0,0,0,0,0,0];
      toRow.g = a.map((v,i) => (v||0) + (b[i]||0));
    }
    toRow.founded = fromRow.founded || toRow.founded;
    toRow.predecessors = [ ...(fromRow.predecessors||[]), { p: fromRow.p, d: fromRow.d, l: fromRow.l, note: link.note }, ...(toRow.predecessors||[]) ];
    removed.add(link.fromKey);
    byKey.set(link.toKey, toRow);
  });
  return Array.from(byKey.values()).filter(r => !removed.has(rowKey(r)));
}

function Sparkline({ values, color, height = 28, width = 100 }) {
  if (!values || values.length === 0) {
    return <div style={{ height, width }} className="flex items-center text-[10px] text-stone-400 font-mono">n/a</div>;
  }
  const max = Math.max(...values, 1);
  const barW = width / values.length;
  return (
    <svg width={width} height={height} className="overflow-visible">
      {values.map((v, i) => {
        const h = Math.max((v / max) * (height - 4), v === 0 ? 1 : 2);
        return (
          <rect key={i} x={i * barW + 1} y={height - h} width={barW - 2} height={h} fill={color} rx={1} />
        );
      })}
    </svg>
  );
}

function FlagStamp({ flags }) {
  if (flags.length === 0) return <span className="text-[11px] font-mono text-stone-400">\u2014</span>;
  return (
    <div
      className="inline-flex items-center justify-center rounded-full border-2 font-serif font-bold uppercase tracking-wide"
      style={{
        borderColor: '#B8462F', color: '#B8462F', fontSize: '9px', padding: '3px 9px',
        transform: 'rotate(-4deg)', letterSpacing: '0.06em', background: 'rgba(184,70,47,0.06)',
      }}
      title={flags.map(f => f.label).join('; ')}
    >
      flagged &times;{flags.length}
    </div>
  );
}

function SmallCohortBadge({ cohortSize, degree }) {
  return (
    <span
      className="inline-flex items-center text-[9px] font-mono uppercase tracking-wide px-1.5 py-0.5 rounded border"
      style={{ color: '#8A8F86', borderColor: '#C9C4B4', background: 'transparent' }}
      title={`Only ${cohortSize} ${degree} program(s) in the current view — percentile-based flags carry less statistical weight with this few data points.`}
    >
      small n={cohortSize}
    </span>
  );
}

function RetiredBadge() {
  return (
    <span
      className="inline-flex items-center text-[9px] font-mono uppercase tracking-wide px-1.5 py-0.5 rounded border border-dashed"
      style={{ color: '#8A8F86', borderColor: '#8A8F86', background: 'transparent' }}
      title="Marked retired/legacy \u2014 excluded from flag thresholds and percentile math for the whole cohort."
    >
      retired
    </span>
  );
}

function LineageManager({ raw, legacyKeys, setLegacyKeys, lineage, setLineage, onClose }) {
  const [retireSel, setRetireSel] = useState("");
  const [fromSel, setFromSel] = useState("");
  const [toSel, setToSel] = useState("");
  const [note, setNote] = useState("");

  const options = useMemo(() => raw.slice().sort((a,b) => rowLabel(a).localeCompare(rowLabel(b))), [raw]);
  const linkedFromKeys = new Set(lineage.map(l => l.fromKey));

  async function addRetire() {
    if (!retireSel) return;
    const key = retireSel;
    setLegacyKeys(prev => new Set(prev).add(key)); // optimistic
    setRetireSel("");
    if (supabaseEnabled) {
      const { error } = await supabase.from('retirements').insert({ key });
      if (error && error.code !== '23505') { // 23505 = already exists, harmless
        console.error('Failed to save retirement:', error);
        setLegacyKeys(prev => { const n = new Set(prev); n.delete(key); return n; }); // roll back
      }
    }
  }
  async function removeRetire(key) {
    setLegacyKeys(prev => { const n = new Set(prev); n.delete(key); return n; }); // optimistic
    if (supabaseEnabled) {
      const { error } = await supabase.from('retirements').delete().eq('key', key);
      if (error) console.error('Failed to remove retirement:', error);
    }
  }
  async function addLink() {
    if (!fromSel || !toSel || fromSel === toSel) return;
    const newLink = {
      fromKey: fromSel, toKey: toSel, note,
      fromLabel: rowLabel(options.find(o => rowKey(o)===fromSel)),
      toLabel: rowLabel(options.find(o => rowKey(o)===toSel)),
    };
    setFromSel(""); setToSel(""); setNote("");
    if (supabaseEnabled) {
      const { data, error } = await supabase.from('lineage_links').insert({
        from_key: newLink.fromKey, to_key: newLink.toKey,
        from_label: newLink.fromLabel, to_label: newLink.toLabel, note: newLink.note,
      }).select().single();
      if (error) { console.error('Failed to save lineage link:', error); return; }
      setLineage(prev => [...prev, { ...newLink, id: data.id }]);
    } else {
      setLineage(prev => [...prev, newLink]);
    }
  }
  async function removeLink(link) {
    setLineage(prev => prev.filter(l => l !== link)); // optimistic
    if (supabaseEnabled && link.id != null) {
      const { error } = await supabase.from('lineage_links').delete().eq('id', link.id);
      if (error) console.error('Failed to remove lineage link:', error);
    }
  }

  const selectStyle = { background: '#233450', color: '#F1F0EA', border: '1px solid #33425C' };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-6" style={{ background: 'rgba(27,42,65,0.5)' }} onClick={onClose}>
      <div className="w-full max-w-2xl max-h-[85vh] overflow-y-auto rounded-lg shadow-2xl" style={{ background: '#EEF1EC' }} onClick={e => e.stopPropagation()}>
        <div className="p-6 flex items-start justify-between" style={{ background: '#1B2A41' }}>
          <div>
            <div className="text-[10px] font-mono uppercase tracking-widest mb-1" style={{ color: '#7C9885' }}>Ledger maintenance</div>
            <h2 className="font-serif text-xl" style={{ color: '#F1F0EA' }}>Retirements &amp; program lineage</h2>
          </div>
          <button onClick={onClose} className="text-xs font-sans" style={{ color: '#A9B7C8' }}>&times; Close</button>
        </div>

        <div className="p-6 space-y-8">
          <div
            className="text-xs font-sans px-3 py-2 rounded"
            style={supabaseEnabled
              ? { background: 'rgba(63,107,82,0.12)', color: '#3F6B52' }
              : { background: 'rgba(184,70,47,0.1)', color: '#B8462F' }}
          >
            {supabaseEnabled
              ? '\u2713 Connected to Supabase \u2014 changes here are saved and will still be here next time anyone opens this dashboard.'
              : '\u26a0 Not connected to a database \u2014 changes here only last for this browser tab and will be lost on refresh. See README.md to connect Supabase.'}
          </div>

          <section>
            <h3 className="font-serif text-lg mb-1" style={{ color: '#1B2A41' }}>Mark a program retired</h3>
            <p className="text-xs font-sans mb-3" style={{ color: '#6B6455' }}>
              Retired programs stay on the ledger but are dropped from every flag threshold and percentile calculation, for every location/degree filter &mdash; not just the view you're in now.
            </p>
            <div className="flex gap-2 mb-3">
              <select value={retireSel} onChange={e => setRetireSel(e.target.value)} className="flex-1 text-sm font-sans px-3 py-2 rounded outline-none" style={selectStyle}>
                <option value="">Select a program/degree/location&hellip;</option>
                {options.map(o => <option key={rowKey(o)} value={rowKey(o)}>{rowLabel(o)}</option>)}
              </select>
              <button onClick={addRetire} className="px-4 py-2 rounded text-sm font-sans font-medium" style={{ background: '#3F6B52', color: '#F1F0EA' }}>Retire</button>
            </div>
            {legacyKeys.size === 0 ? (
              <div className="text-xs font-sans italic" style={{ color: '#8A8F86' }}>Nothing marked retired yet.</div>
            ) : (
              <div className="flex flex-col gap-1.5">
                {Array.from(legacyKeys).map(key => (
                  <div key={key} className="flex items-center justify-between text-xs font-sans px-3 py-2 rounded" style={{ background: '#F1EEE3', border: '1px solid #C9C4B4' }}>
                    <span style={{ color: '#33312D' }}>{key.split('|').join('  \u2014  ')}</span>
                    <button onClick={() => removeRetire(key)} className="font-mono" style={{ color: '#B8462F' }}>remove</button>
                  </div>
                ))}
              </div>
            )}
          </section>

          <section className="border-t pt-6" style={{ borderColor: '#DDD7C8' }}>
            <h3 className="font-serif text-lg mb-1" style={{ color: '#1B2A41' }}>Record a rename / merge</h3>
            <p className="text-xs font-sans mb-3" style={{ color: '#6B6455' }}>
              If Program A became Program B, link them here. Their enrollment and graduation histories combine into one continuous line under B, using A's founding date &mdash; A disappears from the ledger since its story continues under B.
            </p>
            <div className="grid grid-cols-2 gap-2 mb-2">
              <select value={fromSel} onChange={e => setFromSel(e.target.value)} className="text-sm font-sans px-3 py-2 rounded outline-none" style={selectStyle}>
                <option value="">Old name (predecessor)&hellip;</option>
                {options.filter(o => !linkedFromKeys.has(rowKey(o))).map(o => <option key={rowKey(o)} value={rowKey(o)}>{rowLabel(o)}</option>)}
              </select>
              <select value={toSel} onChange={e => setToSel(e.target.value)} className="text-sm font-sans px-3 py-2 rounded outline-none" style={selectStyle}>
                <option value="">New name (successor)&hellip;</option>
                {options.map(o => <option key={rowKey(o)} value={rowKey(o)}>{rowLabel(o)}</option>)}
              </select>
            </div>
            <div className="flex gap-2 mb-3">
              <input value={note} onChange={e => setNote(e.target.value)} placeholder="Optional note, e.g. renamed Fall 2019" className="flex-1 text-sm font-sans px-3 py-2 rounded outline-none placeholder:text-stone-500" style={selectStyle} />
              <button onClick={addLink} className="px-4 py-2 rounded text-sm font-sans font-medium" style={{ background: '#3F6B52', color: '#F1F0EA' }}>Link</button>
            </div>
            {lineage.length === 0 ? (
              <div className="text-xs font-sans italic" style={{ color: '#8A8F86' }}>No lineage links recorded yet.</div>
            ) : (
              <div className="flex flex-col gap-1.5">
                {lineage.map((l,i) => (
                  <div key={l.id ?? i} className="flex items-center justify-between text-xs font-sans px-3 py-2 rounded" style={{ background: '#F1EEE3', border: '1px solid #C9C4B4' }}>
                    <span style={{ color: '#33312D' }}>{l.fromLabel} &rarr; {l.toLabel}{l.note ? ` (${l.note})` : ''}</span>
                    <button onClick={() => removeLink(l)} className="font-mono" style={{ color: '#B8462F' }}>remove</button>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}

function DetailDrawer({ row, onClose, cohortLabel }) {
  if (!row) return null;
  return (
    <div className="fixed inset-0 z-50 flex justify-end" style={{ background: 'rgba(27,42,65,0.35)' }} onClick={onClose}>
      <div className="w-full max-w-md h-full overflow-y-auto shadow-2xl" style={{ background: '#EEF1EC' }} onClick={e => e.stopPropagation()}>
        <div className="p-6" style={{ background: '#1B2A41' }}>
          <button onClick={onClose} className="text-xs font-sans mb-4" style={{ color: '#A9B7C8' }}>&larr; Close</button>
          <div className="text-[11px] font-mono uppercase tracking-widest mb-1" style={{ color: '#7C9885' }}>{row.l} &middot; {row.d}</div>
          <h2 className="font-serif text-2xl leading-tight" style={{ color: '#F1F0EA' }}>{row.p}</h2>
          <div className="text-xs font-mono mt-2" style={{ color: '#A9B7C8' }}>{foundingText(row.founded).full}</div>
          {row.isRetired && (
            <div className="text-xs font-sans mt-2 inline-block px-2 py-1 rounded border border-dashed" style={{ color: '#C9C4B4', borderColor: '#5A6B80' }}>
              Marked retired &mdash; excluded from all flag thresholds
            </div>
          )}
          {row.predecessors && row.predecessors.length > 0 && (
            <div className="text-xs font-sans mt-2" style={{ color: '#7C9885' }}>
              Formerly: {row.predecessors.map((p,i) => (
                <span key={i}>{p.p} ({p.d}){p.note ? ` \u2014 ${p.note}` : ''}{i < row.predecessors.length-1 ? '; ' : ''}</span>
              ))}
            </div>
          )}
        </div>

        <div className="p-6 space-y-6">
          <div>
            <div className="text-[11px] font-mono uppercase tracking-widest mb-2" style={{ color: '#8A8F86' }}>
              Flag rationale &mdash; computed against {cohortLabel}
            </div>
            {row.flags.length === 0 ? (
              <div className="text-sm font-sans" style={{ color: '#33312D' }}>No flags under current filters.</div>
            ) : (
              <div className="flex flex-wrap gap-2 mb-2">
                {row.flags.map(f => (
                  <span key={f.code} className="text-xs font-sans px-2 py-1 rounded" style={{ background: 'rgba(184,70,47,0.1)', color: '#B8462F' }}>
                    {f.label}
                  </span>
                ))}
              </div>
            )}
            {row.smallCohort && (
              <div className="text-xs font-sans mt-2 p-2 rounded" style={{ background: '#F1EEE3', color: '#6B6455', border: '1px solid #C9C4B4' }}>
                Only <strong>{row.cohortSize}</strong> {row.d} program{row.cohortSize===1?'':'s'} exist in this view. Percentile-based flags for small degree groups like this are less statistically meaningful &mdash; read the raw averages above the flag.
              </div>
            )}
          </div>

          <div className="border-t pt-5" style={{ borderColor: '#A98F62' }}>
            <div className="flex items-baseline justify-between mb-2">
              <div className="text-[11px] font-mono uppercase tracking-widest" style={{ color: '#8A8F86' }}>Enrollment, per Winter qtr</div>
              <div className="font-mono text-sm font-bold" style={{ color: '#1B2A41' }}>
                avg {row.enrAvgVal !== null ? row.enrAvgVal.toFixed(1) : '\u2014'}
              </div>
            </div>
            {row.e ? (
              <>
                <div className="flex items-end gap-1 h-16 mb-1">
                  {row.e.map((v,i) => {
                    const max = Math.max(...row.e, 1);
                    return (
                      <div key={i} className="flex-1 flex flex-col items-center justify-end gap-1">
                        <div style={{ height: `${Math.max((v/max)*100,2)}%`, background: '#3F6B52', width: '70%', borderRadius: '2px 2px 0 0' }} />
                        <div className="text-[10px] font-mono" style={{ color: '#33312D' }}>{v}</div>
                      </div>
                    );
                  })}
                </div>
                <div className="flex gap-1">
                  {YEARS_E.map((y,i) => (
                    <div key={i} className="flex-1 text-center text-[10px] font-mono" style={{ color: '#8A8F86' }}>{y}</div>
                  ))}
                </div>
              </>
            ) : <div className="text-sm font-mono text-stone-400">No enrollment data for this location.</div>}
          </div>

          <div className="border-t pt-5" style={{ borderColor: '#A98F62' }}>
            <div className="flex items-baseline justify-between mb-2">
              <div className="text-[11px] font-mono uppercase tracking-widest" style={{ color: '#8A8F86' }}>Graduates, per year</div>
              <div className="font-mono text-sm font-bold" style={{ color: '#1B2A41' }}>
                avg {row.gradAvgVal !== null ? row.gradAvgVal.toFixed(1) : '\u2014'} <span className="font-sans font-normal text-[10px]">('21-'25)</span>
              </div>
            </div>
            {row.g ? (
              <>
                <div className="flex items-end gap-1 h-16 mb-1">
                  {row.g.map((v,i) => {
                    const max = Math.max(...row.g, 1);
                    const partial = i === 5;
                    return (
                      <div key={i} className="flex-1 flex flex-col items-center justify-end gap-1">
                        <div style={{ height: `${Math.max((v/max)*100,2)}%`, background: partial ? '#B8462F55' : '#1B2A41', width: '70%', borderRadius: '2px 2px 0 0' }} />
                        <div className="text-[10px] font-mono" style={{ color: '#33312D' }}>{v}</div>
                      </div>
                    );
                  })}
                </div>
                <div className="flex gap-1">
                  {YEARS_G.map((y,i) => (
                    <div key={i} className="flex-1 text-center text-[10px] font-mono" style={{ color: i===5 ? '#B8462F' : '#8A8F86' }}>{y}{i===5?'*':''}</div>
                  ))}
                </div>
                <div className="text-[10px] font-sans mt-2" style={{ color: '#8A8F86' }}>* partial year, excluded from average</div>
              </>
            ) : <div className="text-sm font-mono text-stone-400">No graduation data for this location.</div>}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ProgramLedger() {
  const [activeLocs, setActiveLocs] = useState(["Savannah", "Atlanta", "SCADnow"]);
  const [degreeFilter, setDegreeFilter] = useState("All");
  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState("flagCount");
  const [sortDir, setSortDir] = useState("desc");
  const [selected, setSelected] = useState(null);
  const [onlyFlagged, setOnlyFlagged] = useState(false);
  const [legacyKeys, setLegacyKeys] = useState(new Set());
  const [lineage, setLineage] = useState([]);
  const [manageOpen, setManageOpen] = useState(false);
  const [loadError, setLoadError] = useState(null);

  useEffect(() => {
    if (!supabaseEnabled) return;
    let cancelled = false;
    (async () => {
      const [retiredRes, linksRes] = await Promise.all([
        supabase.from('retirements').select('key'),
        supabase.from('lineage_links').select('*'),
      ]);
      if (cancelled) return;
      if (retiredRes.error || linksRes.error) {
        setLoadError((retiredRes.error || linksRes.error).message);
        return;
      }
      setLegacyKeys(new Set(retiredRes.data.map(r => r.key)));
      setLineage(linksRes.data.map(l => ({
        id: l.id, fromKey: l.from_key, toKey: l.to_key,
        fromLabel: l.from_label, toLabel: l.to_label, note: l.note,
      })));
    })();
    return () => { cancelled = true; };
  }, []);

  const mergedRaw = useMemo(() => applyLineage(RAW, lineage), [lineage]);

  const allDegrees = useMemo(() => {
    const s = new Set(mergedRaw.map(r => r.d));
    return ["All", ...Array.from(s).sort()];
  }, [mergedRaw]);

  const filteredBase = useMemo(() => {
    return mergedRaw.filter(r =>
      activeLocs.includes(r.l) &&
      (degreeFilter === "All" || r.d === degreeFilter) &&
      (search.trim() === "" || r.p.toLowerCase().includes(search.trim().toLowerCase()))
    );
  }, [mergedRaw, activeLocs, degreeFilter, search]);

  const flagged = useMemo(() => computeFlags(filteredBase, legacyKeys), [filteredBase, legacyKeys]);

  const rows = useMemo(() => {
    let r = flagged;
    if (onlyFlagged) r = r.filter(x => x.flags.length > 0);
    const dir = sortDir === "asc" ? 1 : -1;
    const withSort = [...r].sort((a,b) => {
      if (sortKey === "flagCount") return (a.flags.length - b.flags.length) * dir;
      if (sortKey === "program") return a.p.localeCompare(b.p) * dir;
      if (sortKey === "enrAvg") return ((a.enrAvgVal ?? -1) - (b.enrAvgVal ?? -1)) * dir;
      if (sortKey === "gradAvg") return ((a.gradAvgVal ?? -1) - (b.gradAvgVal ?? -1)) * dir;
      return 0;
    });
    return withSort;
  }, [flagged, sortKey, sortDir, onlyFlagged]);

  const stats = useMemo(() => {
    const total = flagged.length;
    const flaggedCount = flagged.filter(r => r.flags.length > 0).length;
    const enrFlagged = flagged.filter(r => r.flags.some(f => f.code.startsWith('E'))).length;
    const gradFlagged = flagged.filter(r => r.flags.some(f => f.code.startsWith('G'))).length;
    return { total, flaggedCount, enrFlagged, gradFlagged };
  }, [flagged]);

  const cohortLabel = `${activeLocs.length === LOCATIONS.length - 1 && !activeLocs.includes('Overall') ? 'all locations' : activeLocs.join(', ')}${degreeFilter !== 'All' ? ', ' + degreeFilter + ' only' : ''} (${filteredBase.length} programs)`;

  function toggleLoc(loc) {
    setActiveLocs(prev => prev.includes(loc) ? prev.filter(l => l !== loc) : [...prev, loc]);
  }

  function toggleSort(key) {
    if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortKey(key); setSortDir('desc'); }
  }

  return (
    <div className="flex min-h-screen w-full font-sans" style={{ background: '#EEF1EC' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,600;9..144,700&family=Public+Sans:wght@400;500;600;700&family=IBM+Plex+Mono:wght@400;500;600&display=swap');
        .font-serif { font-family: 'Fraunces', serif; }
        .font-sans { font-family: 'Public Sans', sans-serif; }
        .font-mono { font-family: 'IBM Plex Mono', monospace; }
        ::-webkit-scrollbar { width: 8px; height: 8px; }
        ::-webkit-scrollbar-thumb { background: #A98F62; border-radius: 4px; }
      `}</style>

      <aside className="w-72 shrink-0 p-6 flex flex-col gap-7" style={{ background: '#1B2A41' }}>
        <div>
          <div className="text-[10px] font-mono uppercase tracking-[0.2em] mb-1" style={{ color: '#7C9885' }}>SCAD &middot; Curriculum &amp; Assessment</div>
          <h1 className="font-serif text-2xl leading-tight" style={{ color: '#F1F0EA' }}>Program Ledger</h1>
          <p className="text-xs font-sans mt-2 leading-relaxed" style={{ color: '#A9B7C8' }}>
            Enrollment and graduation health, tracked side by side. Flags recompute live from whatever's in view.
          </p>
        </div>

        <div>
          <div className="text-[10px] font-mono uppercase tracking-widest mb-2" style={{ color: '#7C9885' }}>Location</div>
          <div className="flex flex-col gap-1.5">
            {LOCATIONS.map(loc => (
              <button
                key={loc}
                onClick={() => toggleLoc(loc)}
                className="text-left px-3 py-2 rounded text-sm font-sans transition-colors"
                style={{
                  background: activeLocs.includes(loc) ? (loc === 'Overall' ? '#7C5B8A' : '#3F6B52') : 'transparent',
                  color: activeLocs.includes(loc) ? '#F1F0EA' : '#7A8699',
                  border: '1px solid ' + (activeLocs.includes(loc) ? (loc === 'Overall' ? '#7C5B8A' : '#3F6B52') : '#33425C'),
                }}
              >
                {loc}{loc === 'Overall' ? ' (all campuses combined)' : ''}
              </button>
            ))}
          </div>
          {activeLocs.includes('Overall') && activeLocs.length > 1 && (
            <div className="text-[10px] font-sans mt-2 leading-snug" style={{ color: '#C9A96E' }}>
              Heads up: Overall is a sum across campuses. Combining it with individual campuses will double-count programs in the stats above.
            </div>
          )}
        </div>

        <div>
          <div className="text-[10px] font-mono uppercase tracking-widest mb-2" style={{ color: '#7C9885' }}>Degree</div>
          <select
            value={degreeFilter}
            onChange={e => setDegreeFilter(e.target.value)}
            className="w-full text-sm font-sans px-3 py-2 rounded outline-none"
            style={{ background: '#233450', color: '#F1F0EA', border: '1px solid #33425C' }}
          >
            {allDegrees.map(d => <option key={d} value={d}>{d}</option>)}
          </select>
        </div>

        <div>
          <div className="text-[10px] font-mono uppercase tracking-widest mb-2" style={{ color: '#7C9885' }}>Search program</div>
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="e.g. Illustration"
            className="w-full text-sm font-sans px-3 py-2 rounded outline-none placeholder:text-stone-500"
            style={{ background: '#233450', color: '#F1F0EA', border: '1px solid #33425C' }}
          />
        </div>

        <label className="flex items-center gap-2 text-sm font-sans cursor-pointer" style={{ color: '#F1F0EA' }}>
          <input type="checkbox" checked={onlyFlagged} onChange={e => setOnlyFlagged(e.target.checked)} />
          Show flagged only
        </label>

        <div className="mt-auto pt-5 border-t text-[11px] font-sans leading-relaxed" style={{ borderColor: '#33425C', color: '#7A8699' }}>
          <div className="font-mono uppercase tracking-widest mb-1" style={{ color: '#7C9885' }}>How flags work</div>
          A program is flagged when its 5-yr average enrollment or graduate count is &le;10, or falls in the bottom 10% of whatever's currently in view. Thresholds recalculate every time you change a filter &mdash; they're never baked in.
          <br /><br />
          Degree types with {SMALL_COHORT_THRESHOLD} or fewer programs in view (e.g. MBI) get a <span style={{fontFamily:'IBM Plex Mono'}}>small n=</span> badge instead of being treated as an equally-confident percentile flag.
          <br /><br />
          The date under each program name is inferred, not recorded: the first quarter (back to Fall 2010) with any enrollment on file. "Pre-2010" means it already had students in our earliest quarter, so it's older than we can see &mdash; not that it started then.
        </div>
      </aside>

      <main className="flex-1 p-8 overflow-y-auto">
        <div className="grid grid-cols-4 gap-4 mb-8">
          {[
            { label: 'Programs in view', value: stats.total, color: '#1B2A41' },
            { label: 'Flagged (any reason)', value: stats.flaggedCount, color: '#B8462F' },
            { label: 'Flagged &mdash; enrollment', value: stats.enrFlagged, color: '#3F6B52' },
            { label: 'Flagged &mdash; graduation', value: stats.gradFlagged, color: '#3F6B52' },
          ].map((s,i) => (
            <div key={i} className="p-4 rounded-lg" style={{ background: '#F8F7F2', border: '1px solid #DDD7C8' }}>
              <div className="text-[10px] font-mono uppercase tracking-widest mb-2" style={{ color: '#8A8F86' }} dangerouslySetInnerHTML={{__html: s.label}} />
              <div className="font-serif text-4xl font-semibold" style={{ color: s.color }}>{s.value}</div>
            </div>
          ))}
        </div>

        <div className="flex items-baseline justify-between mb-3">
          <h2 className="font-serif text-xl" style={{ color: '#1B2A41' }}>Ledger</h2>
          <div className="flex items-center gap-4">
            {loadError && (
              <div className="text-xs font-sans" style={{ color: '#B8462F' }} title={loadError}>
                Couldn't load saved retirements/lineage
              </div>
            )}
            <div className="text-xs font-mono" style={{ color: '#8A8F86' }}>cohort: {cohortLabel}</div>
            <button
              onClick={() => setManageOpen(true)}
              className="text-xs font-sans px-3 py-1.5 rounded"
              style={{ background: '#1B2A41', color: '#F1F0EA' }}
            >
              Manage retirements &amp; lineage
            </button>
          </div>
        </div>

        <div className="rounded-lg overflow-hidden" style={{ border: '1px solid #DDD7C8', background: '#F8F7F2' }}>
          <table className="w-full text-sm">
            <thead>
              <tr style={{ background: '#1B2A41' }}>
                <th onClick={() => toggleSort('program')} className="text-left px-4 py-3 font-sans font-medium cursor-pointer select-none" style={{ color: '#F1F0EA' }}>
                  Program {sortKey==='program' && (sortDir==='asc'?'\u2191':'\u2193')}
                </th>
                <th className="text-left px-3 py-3 font-sans font-medium" style={{ color: '#F1F0EA' }}>Degree</th>
                <th className="text-left px-3 py-3 font-sans font-medium" style={{ color: '#F1F0EA' }}>Location</th>
                <th className="text-left px-3 py-3 font-sans font-medium" style={{ color: '#F1F0EA' }}>Enrollment '21-'25</th>
                <th onClick={() => toggleSort('enrAvg')} className="text-right px-3 py-3 font-sans font-medium cursor-pointer select-none" style={{ color: '#F1F0EA' }}>
                  Avg {sortKey==='enrAvg' && (sortDir==='asc'?'\u2191':'\u2193')}
                </th>
                <th className="text-left px-3 py-3 font-sans font-medium" style={{ color: '#F1F0EA' }}>Graduates '21-'25</th>
                <th onClick={() => toggleSort('gradAvg')} className="text-right px-3 py-3 font-sans font-medium cursor-pointer select-none" style={{ color: '#F1F0EA' }}>
                  Avg {sortKey==='gradAvg' && (sortDir==='asc'?'\u2191':'\u2193')}
                </th>
                <th onClick={() => toggleSort('flagCount')} className="text-center px-4 py-3 font-sans font-medium cursor-pointer select-none" style={{ color: '#F1F0EA' }}>
                  Status {sortKey==='flagCount' && (sortDir==='asc'?'\u2191':'\u2193')}
                </th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r,i) => (
                <tr
                  key={r.l+r.p+r.d}
                  onClick={() => setSelected(r)}
                  className="cursor-pointer transition-colors hover:bg-black/[0.03]"
                  style={{ borderTop: i===0 ? 'none' : '1px solid #E5E0D3' }}
                >
                  <td className="px-4 py-3">
                    <div className="font-serif" style={{ color: '#1B2A41' }}>{r.p}</div>
                    <div
                      className="font-mono text-[10px] mt-0.5"
                      style={{ color: r.founded ? '#8A8F86' : '#B8AFA0' }}
                      title={foundingText(r.founded).full}
                    >
                      {foundingText(r.founded).short}
                    </div>
                    {r.predecessors && r.predecessors.length > 0 && (
                      <div className="text-[10px] font-sans mt-0.5 italic" style={{ color: '#7C9885' }} title={r.predecessors.map(p => `${p.p} (${p.d})${p.note ? ' \u2014 ' + p.note : ''}`).join('; ')}>
                        formerly {r.predecessors.map(p => p.p).join(', ')}
                      </div>
                    )}
                  </td>
                  <td className="px-3 py-3 font-mono text-xs" style={{ color: '#5A5A54' }}>{r.d}</td>
                  <td className="px-3 py-3 font-sans text-xs" style={{ color: '#5A5A54' }}>{r.l}</td>
                  <td className="px-3 py-3"><Sparkline values={r.e} color="#3F6B52" /></td>
                  <td className="px-3 py-3 text-right font-mono font-semibold" style={{ color: '#1B2A41' }}>
                    {r.enrAvgVal !== null ? r.enrAvgVal.toFixed(1) : '\u2014'}
                  </td>
                  <td className="px-3 py-3"><Sparkline values={r.g ? r.g.slice(0,5) : null} color="#1B2A41" /></td>
                  <td className="px-3 py-3 text-right font-mono font-semibold" style={{ color: '#1B2A41' }}>
                    {r.gradAvgVal !== null ? r.gradAvgVal.toFixed(1) : '\u2014'}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <div className="flex flex-col items-center gap-1">
                      {r.isRetired ? <RetiredBadge /> : <FlagStamp flags={r.flags} />}
                      {r.smallCohort && <SmallCohortBadge cohortSize={r.cohortSize} degree={r.d} />}
                    </div>
                  </td>
                </tr>
              ))}
              {rows.length === 0 && (
                <tr><td colSpan={8} className="text-center py-10 font-sans text-sm" style={{ color: '#8A8F86' }}>No programs match these filters.</td></tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="mt-4 text-[11px] font-sans" style={{ color: '#8A8F86' }}>
          Click any row for the full 5-year trend and flag rationale. Source: SCAD_Winter_Enrollment_Analysis.xlsx &amp; SCAD_Graduate_Analysis.xlsx. "Overall" is computed by summing each location's counts per program/degree, not read from a separate pre-aggregated tab.
        </div>
      </main>

      <DetailDrawer row={selected} onClose={() => setSelected(null)} cohortLabel={cohortLabel} />
      {manageOpen && (
        <LineageManager
          raw={mergedRaw}
          legacyKeys={legacyKeys}
          setLegacyKeys={setLegacyKeys}
          lineage={lineage}
          setLineage={setLineage}
          onClose={() => setManageOpen(false)}
        />
      )}
    </div>
  );
}
