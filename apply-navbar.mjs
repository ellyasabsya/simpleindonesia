#!/usr/bin/env node
// apply-navbar.mjs
// Jalankan dari akar proyek Laravel Anda:  node apply-navbar.mjs
//
// Yang dikerjakan:
//  - Bilah atas (beranda HP, tamu): logo "S" di kiri, ikon cari + bulan di kanan.
//    Teks "SIMPLE." dan tombol "Masuk" dihapus.
//  - Bilah bawah: menu "Berita" diganti "Saya" (ikon orang), semua ikon dibuat
//    lebih premium (berkas baru nav-icons.tsx).
//  - "Saya": tamu -> /login, sudah masuk -> /profil/edit.
//
// Aman: semua bagian diperiksa dulu. Kalau ada satu saja yang tidak cocok,
// skrip BATAL dan tidak mengubah apa pun. Berkas lama dicadangkan dulu.

import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const M = 'resources/js/components/mobile';
const ICONS_SRC = "import type { ReactNode } from 'react';\n\n// Ikon bilah bawah gaya \"premium\": garis tipis berujung bulat + isian lembut\n// seperti kaca di dalam bentuknya. Saat menu aktif, isiannya menebal.\n// Semua memakai currentColor, jadi warnanya mengikuti tema (terang/gelap).\n\ntype IconProps = {\n    className?: string;\n    strokeWidth?: number;\n    /** menu sedang aktif: isian lembut dibuat lebih pekat */\n    active?: boolean;\n};\n\nfunction Svg({\n    className,\n    strokeWidth = 1.6,\n    children,\n}: IconProps & { children: ReactNode }) {\n    return (\n        <svg\n            viewBox=\"0 0 24 24\"\n            fill=\"none\"\n            stroke=\"currentColor\"\n            strokeWidth={strokeWidth}\n            strokeLinecap=\"round\"\n            strokeLinejoin=\"round\"\n            className={className}\n            aria-hidden=\"true\"\n        >\n            {children}\n        </svg>\n    );\n}\n\nconst tint = (active?: boolean) => (active ? 0.24 : 0.09);\n\nexport function CalendarIcon(p: IconProps) {\n    return (\n        <Svg {...p}>\n            <rect x=\"3.5\" y=\"5\" width=\"17\" height=\"15.5\" rx=\"4\" fill=\"currentColor\" fillOpacity={tint(p.active)} />\n            <path d=\"M3.5 10h17\" />\n            <path d=\"M8 3.5v3M16 3.5v3\" />\n            <circle cx=\"8.5\" cy=\"14.5\" r=\"0.9\" fill=\"currentColor\" stroke=\"none\" />\n            <circle cx=\"12\" cy=\"14.5\" r=\"0.9\" fill=\"currentColor\" stroke=\"none\" />\n            <circle cx=\"15.5\" cy=\"14.5\" r=\"0.9\" fill=\"currentColor\" stroke=\"none\" />\n        </Svg>\n    );\n}\n\nexport function TicketIcon(p: IconProps) {\n    return (\n        <Svg {...p}>\n            <path\n                d=\"M3.5 9V7.5a2 2 0 0 1 2-2h13a2 2 0 0 1 2 2V9a2.5 2.5 0 0 0 0 5v2.5a2 2 0 0 1-2 2h-13a2 2 0 0 1-2-2V14a2.5 2.5 0 0 0 0-5Z\"\n                fill=\"currentColor\"\n                fillOpacity={tint(p.active)}\n            />\n            <path d=\"M14.5 7.5v1.4M14.5 11.3v1.4M14.5 15.1v1.4\" />\n        </Svg>\n    );\n}\n\nexport function VoteIcon(p: IconProps) {\n    return (\n        <Svg {...p}>\n            <path d=\"M8 13.5V5.5a1.5 1.5 0 0 1 1.5-1.5h5A1.5 1.5 0 0 1 16 5.5v8\" />\n            <path d=\"m10.3 8.3 1.4 1.4 2.4-2.9\" />\n            <path\n                d=\"M4 13.5h16V19a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1Z\"\n                fill=\"currentColor\"\n                fillOpacity={tint(p.active)}\n            />\n        </Svg>\n    );\n}\n\nexport function PersonIcon(p: IconProps) {\n    return (\n        <Svg {...p}>\n            <circle cx=\"12\" cy=\"8.2\" r=\"3.7\" fill=\"currentColor\" fillOpacity={tint(p.active)} />\n            <path\n                d=\"M4.8 20.2c.5-3.6 3.5-5.7 7.2-5.7s6.7 2.1 7.2 5.7Z\"\n                fill=\"currentColor\"\n                fillOpacity={tint(p.active)}\n            />\n        </Svg>\n    );\n}\n\nexport function AwardIcon(p: IconProps) {\n    return (\n        <Svg {...p}>\n            <path d=\"M8.6 14.2 7 20.5l5-2.4 5 2.4-1.6-6.3\" />\n            <circle cx=\"12\" cy=\"9.5\" r=\"5.5\" fill=\"currentColor\" fillOpacity={tint(p.active)} />\n            <path d=\"m12 7 .9 1.8 2 .3-1.45 1.4.35 2-1.8-.95-1.8.95.35-2L9.1 9.1l2-.3Z\" strokeWidth=\"1\" />\n        </Svg>\n    );\n}\n\nexport function BuildingIcon(p: IconProps) {\n    return (\n        <Svg {...p}>\n            <path\n                d=\"M5 20.5V5.5A1.5 1.5 0 0 1 6.5 4h7A1.5 1.5 0 0 1 15 5.5v15\"\n                fill=\"currentColor\"\n                fillOpacity={tint(p.active)}\n            />\n            <path d=\"M15 10h3.5a1.5 1.5 0 0 1 1.5 1.5v9\" />\n            <path d=\"M3 20.5h18\" />\n            <path d=\"M8.5 8h3M8.5 11.5h3M8.5 15h3\" />\n        </Svg>\n    );\n}\n\nexport function WalletIcon(p: IconProps) {\n    return (\n        <Svg {...p}>\n            <path d=\"M5.5 7.5 16 4.8a1.5 1.5 0 0 1 1.9 1.45V7.5\" />\n            <rect x=\"3.5\" y=\"7.5\" width=\"17\" height=\"12\" rx=\"3\" fill=\"currentColor\" fillOpacity={tint(p.active)} />\n            <path d=\"M20.5 12.5h-4a2 2 0 0 0 0 4h4\" />\n            <circle cx=\"16.7\" cy=\"14.5\" r=\"0.8\" fill=\"currentColor\" stroke=\"none\" />\n        </Svg>\n    );\n}\n\nexport function MenuIcon(p: IconProps) {\n    return (\n        <Svg {...p}>\n            <path d=\"M4.5 7h15M4.5 12h15M4.5 17h9\" />\n        </Svg>\n    );\n}\n";
const LOGO_B64 = "iVBORw0KGgoAAAANSUhEUgAAAJAAAACQCAYAAADnRuK4AABIoElEQVR42u29eZxdV3Um+n1rn3tvDRowxAbj2GYKCTakEwyEAI0kaAi/B2EIlGheQqYOJsmDpPPopEkneaUiIdCdBMLwSHAwg0esYgyEIRgkBdPGgAkYy2DADnjAE3iSSlV17z179R97WvvcEp4kSyY6/Aqrbp17z7lnr72Gb31rLeDIceQ4chw5DtXBI49g4llo59/xb/ll3c9zC+eqlr+xc5pq/brq2pemvS7WOqncs/6QW+LE+WvdNTvn0vx//HvnI0j9dyRASsxvI04+mTj66PJ9b7pJsXu3Yts2tQ/kyPHv/VAltm932LGjwXZ1d+l96ZifF8zPi/mbYPt2VwmlfZ99b772dgfV8DnpnPQ58bV5VZkv58hces/+7s9eJ92qztvPYPjceZm3938H33s+XJNrPYt5Vdm0Y0cTfuabU7709p59Nj8aGmh+XrBtG7G4CGzd2nYekEx/8+pjdWn1xLaRh1LkeKgeR+oxIm49VDeoyBTV95X0QRv5hqoUJyN4DyUbqFKEY4BKAQEqqBChOIBKtAAgYI9UAempquKcCsOikCChVGELqDpVoQCgqtCBgCNUIRghvEyXLB5Br0pHeEdRDwAOcKAjIQBUBEp4ggLCQ8A2mCUFiCAlVKqCFChUpQHDAW0hHMNrA4EAGIMAvQ4UcOq9qrAR72+ZuenGZ/3zCU+6GarkfVrTIDw4kD6/vuPSdc39pk8C+UQhfp7QR5M8viU3YjAAmyYsiLagAsx+iGZ3geknrDw0PP/4OyFhJcI5TC4Ng+ylc0lQCMbzo/RkxyX/MPwtfnT5rHiexNdo3CrSuEtUCAghQUG+p+zc5PcrQEAYXC9GqUvXSN+nPIP0X0Kh8H4MyAx0Zelbx0594VGL3NpClc19UHAkrlYLhF0/9aUrTmghT6PTZ3r1TwJ5IqZnoFBgNIKOh1DoGEtjDxFVYXBVqeGpBw2SF826zaAooNS0wACUBBnPTO51MjAaFkxIaPyvJyBQpv0a1itsX4lS4QlCFNSoJuK9hLVWML8GILpsSbBUgjjG87LAqAYhykJIwAPx3hWeUUBofGgjSGkjKACvbcu+7yvk64vc2s6rygLp7zsCtF0d5uCTttn4r/92v32tPk+BrSPvn4LZwQYIgNUV0LdjLO1tFUoNzyhoaaJRQqlKBeNO1Lzr895j0EyMQVDa8R5RU5hgqpylgC++eFwo9QqIKn3WAkmIqBpEE1ANcuPj4qtmPZVVjQbBlXCmVvGgAj6eLfn1ok98UKFB42bNk3aIRuGL9xXdH1LplSYMFBX0xPulywBgJ3YKgMNegILjSbbYyhYApr905c+Nm+bFe8ftCzGYOsF7BVaWwX1Lw7iDBFFYwgaKRkoZnpFH0AQsUXJQHT4bjokQPC5UWhxNTklWikXdl0iYOQT2aWHzn6kKBTSYRyUgUd8ojKqLr4kxrFpCa03aQg3C4KPgS9Q0SUBsJJ7Pp3GDtfwajDmVBDXeFZSiwS36PAAcg80KAM1hrXG2sgXZQpX9L1/1HFX83pj+6TqYprZLwL7lUXRQRBWNfRhgUtXMmxUaPEkadCTsPpTdmBZOw25nXGBqWEySVilkLIdJC+SdHARLownxyWLCLHQ0KaLF8/DJNKkFZDSaGYXX4idBSzwY3C9WGjAJXvq8DFUx/1/UTPmEAk0V+SVAFSeNH67crnBfBIDFbdv08IzCtm93mJsL0dCOHU1v5sRf9uTvwrkn0Dno6nILsFWoSxZaVYtDkDavxEAJrL9lNiHR3nfsf4lNmf2G/NHGk7VOMarNrJDsnBRnvPNZ+eFLEAymcyTeL9F1nouKCD5NEGlYHydeVIyCNY8FwXDX3yf9CFmwQ+PLBYMO7wbTjQ5XLvzc4IQnQZUJO2sOs6gqOcdwn/u350Pwx34w9QQdj4DV1VE0PY7QJm7xuBLxESVtIMmssIPlFgRYo+4X2rjLYr0Wjs0rYD4iRmfGf0r6zmtaqGJ2VJMJ1KxlJLuqgMT79dmrQjRfLNfQ4neF5xX0jk/nVdonmecS6cWAPmg3YfTzoiOtqAS/RJ8ECC/ow4+XLgCATdjpdgHjw0eAduxoQI4BKD57xTNI/Ik2bpMCwJ69I4an6NL2iFa5OBVqtEZWJknAaBGyyvEkFOrDZooGv7hA5vxsGiS+pJqd0aRKOKH+y4JJWB2or2UyyIGGtTWJA+Qgi9lEaRTesDHyF8xv9Go0akCDstmNmFKJ2hjMZjft4TubjtFhV/Vu1C6pa4cfDf7PTfndzSHXOtu2EVu2jPGJrx3PmZm/oLhf1cYBqyujGD+5OkNlhYKVA5kcXKbnKp1MktesnoODk9/KyRxS8jG0eJ2+fuoq6R5M6O9RIjUTCYlXQGprm76Ilsg8C7oW/yP53RkgpgIiJrUWcSDNIWS8bfOhau5ToqaTbhoP5qay1lTPfq/nh6vf2Lt+9HmocjG4aodYgFRdNFcqu658uZILGAweqEt7Wo7oQTiS2RElCXiah0J0ZCfGs4oA/VpHWYsCSjs1GZ0Y0iezJlbVs2QusjtrHR8fzKXVankJkkph7exm0Ci9osiOeha2KvhT0H7XpC1aTxJK8/neKyhQ0SriM5q1mMYES+TQv+h0lq9H9fC+cVNgu/rBy/jo4Sbd0ezClvEhFCAltiOE5udffpw0vbfq1MzzsbwX2Ld3CJFGAQdV0BuzUUKNOjeexMPu4ByqGHukHaOnnZA2fbwvzmcAajo7NDs+UbC9xnNt+G/uKWIwCiLj5R5UYa12wk1l2CEEgFHbahRUY+E0apIsfFoehodmzCcFEQVq0OLBR8lLgGLZjOXDlOyNVvatuJXhGQCwC5u9XU25V2VnXgUKYCtb9+kr56TpfVH7U8/H3j1DqLakNJXHoho8Qu3+JAwlPABqlYmoAI8sBFq2NGHcB4sOJwHR4iQnfyteMv5b4X383Wv5W3qfT68bzec9fAQMNYbx4bzy3qS+fPgJudF8HXOehn3ofThXQXgNIb6PmiUBpT7eh6pJonhAPeGTP2k+3yvQemDsFa2i1ZlZ8aPRBy8++qe+MafbXZU2ulc1UMJ1sKPhp674a9/r/T7bEbBv7wjCpjZFdQClUc1D0HnRIMjsAGWqJsxmdDDjClCgaoCUeJ63IX18PTuiyRRodLhZfC6LTGdzoqxMEZI2UAthGq0asaec4DOhtBq1axxuQCLi7TVY+wQNaMjxFF8rBWxqMlzBzKoxj9SQsgnySYWqcGV1LN79DQAsrrGszb0WZW3hGB+99EEczL6HszPP1KXbRxpSDK7iRhlLZ7CusG+9xWLSaVGtq3VCQuJTK2qYxoeS0k3M6nrCx8joawFLaKN7aOUtqLIyCSnSUa0jMnuRvNgpdhSjxTJOE+9LNSdDNSflEsjJlPNi3BVQCWKfMCXvI2LGIunRL6ImlRpwzmDCBaCy5fp1fezZe97X7nfixXPbt7tFdpgO9wqQuGNHE6Ksy5/AZnA2er1HYGVpCGFTA3d5G5iwhLAbKG3pjAhTM6inHfuVHN5K4AwQqFFdpMXOuA214gIyJkVpkowaEpvM+ErnO4gBG4ucxWSn8d0ojJlhJUWyRhJEYC+9P7MBMi6T0xQGRs/hugiU5jvlt6VblYCJh29WhDNHkhEkZK8ZDdrVU76y/sSvxy/gu8sr94rwfPzKrexNfwYij8DKviFEGiu7rBVFRShQg3XE7VKxL4Hgb6Dj66h1ClUnBMz6TMUqavYv1DjZyXQZDUeoQr2PPwrrb3ci8vzZ6RwftkBw8ZQh2kkuk7L2uezX8sFHUWXwbaKfo+l+0+15ZXwvVTWRgqCQCELGDDuSzxTuI1+v1RYb1ju/vHL6VzY85LI5QNYSnkhJOrjCIx+9/FT0B+9BO27oxyOwUEiqUNmkIQj77ygIdqerzbV2QJxMmGEVhGX6hcFcKAbv74CAgXFlcvTaSYlYgIkwyFRMM9gcilreUEqz1vkGjaBiuT9OpFasP5f12gSdmiaTbyk+XMvo0JKfA7wAz37PYWX12umV1f/7+r++/8pl23YCu3bpvUeqz8JzxR+gP3iDDveNIQBFRIkO38aaAS3JwerutHO3WkuZliQoS4KpYo2rMU/5s0UCtcP4GpqIZB0UgOiE75lLE0VHcp4qXIoSftGau1OyElrlryKpLKbxinAI698BGM5PiAeiyspmiimJlQSSJsmb8mi0qJYW8oiwldnZnty695e+8aATPjin6hZjeune0UBJeP7xG6/WqXV/pcPlEakCEakNVkpIskbIKiZFjedkjZAdaEugKMLY/UzLaskJKxRGYf6H3bb5cwRr3CLsClMMw8vKHQtw2flitM505lUafzv7NpQKqO6yTBL7THMewzhd3eqQ/BVzOr6khYLTP5aNG/u4dc+bvvmgE/4Wqu6yHyI8Bz4K26ENtnAsH/zmf9Xp9a/T5aURBRISQZZjp5m4VJ6OmtBds9enlfLVgvKKSWvHCKzOZTEycVgCoLXKUdSsJztREw2inMygDcC0ePglD1a0IbSDPqtaZ4/5fhIknKCDkrLRqKuyCgnZlMJdYtG7JZmqtlZHs6Y0jhI7tA3Aa9tsWN/X2/f+y88ec/yrvhWKCPwdLXlzwEP1D3xjq+/138ilvVF4mIUHtPYdedGLL5QEgZPFTFaYOoSutIC0BCvjY+Vr+kDyoRFctSAOa9uo3pe0B6kVCp3YIgmk03Jvmm4pENpKjimH9ooKoYgioJWiLM/ATwQbLIpUWTEHtBsZMHKMKo5eh8LivefUoOdXhjdODVd/dTFwsOTOlDs1Bwwk3MIx3rv7qWDvPRiNWtCLqpAZA9Ou21LwugqMsyF5ndjLEqjmQ/JKsJMFD6UHVZ6s4EFr1hOaJG3JTuUkmC+RGmlKDIvwruFiq2rk+qTEb8JzUCimhrxoYIySt8mYp7G2VcljlG+vrCysGpdavWYJ1MRaDM/Qo9dzQrfU27fvhV8/7mHfxfbtKU+Jgy9A8yrYyhZnXPoIDqYXAR0oMAadKxlyrUupWPEZDF3HoL4dKibtItNGFlrzkhU546w5YVoRrhiy8rQUjmgoKlxFLXHKZJEKctxhNhaKac2DzKh3wqaUVlOZKKhoFDW8wTVFkx3eUuI9G2JugSeYUqdMUWsEDT0b50SaVVlafuE3jzvxAuiOBizJUhzU0mZVYhECXN0HVnZxeurxGK0OlWxIA/wZQE/ZjT21bKuAoEWToRW3y+SvqzxpQfQ6xcA2jyBFgpM8KOswOdZJJTumNoo2JTvUQpRBCtWVUAoNw1HzezI3msbN6ZTpAIGeka9jtgAMaFmBkewAn5a+mgDNaDMlO4jWvdZWev2eNLLS37f0wiuPf+jHoJp4WXf6uGdA4radDlvZsl36S06vezxW9q0CaMRQ41TXSobW9rxoE5bvqYXqUOW3kJKDJeNdOYTJNHpjARKqVtsWQH3ZqR7MxZ8RnDXonkl4lv2dEqrl8xTwGe0zdT4F8iUspqn5e/mcwGUGMmOykznhacDIAjbSAIpaJV1DIjVfIulYqOqY0zM9itza27v83LsrPPdMAwUny+PcbzwdTf+f6YetOhFKADS0joyLBpI6vZDg+7SDNbuWOUitehIodSJ1wIr42/E4S7VfnWir0gyo/SKmoElrnKoEPGXxGYu+crqjg1ElTjSqz2flRbMLQxguj8GuLCdbDCaUdkq3kNCgHWAJglU2buzJyvIlU6urv3LlCSd8zXCz7vIhd59JCGD7l4+GNO8KvFAJIUeEytMumkhYdGgXlRbSuEfyf9NaJ0yGqchrjc+0OQRDpUj1m1plQzMFJO1YxmumIqDkmKfqilp4kHGsLA9qor2USbV0jg5pKVFHwsdbim5FG6myMKr1OUBN81CadERObygD/UTHHmy4fn1P9i29Y/23bn7KPRWeuy9Ai4uCBXqOZl7L6dnj6dsRCFe+nKmT0kiJyNwcE2OZcN2qaGidXdeK6mlByA4Byur3SsAYi8HASJYp+JOWBa4tYTGTrOqquL/GLtmJ1645NSU+Gr90ERJUeFH5CtoJ5yyZ33CUUKiu6tVcNhVPS6sK5ey6AVzzfd6+93e+d+yxL7v8KY/ak2vu7sEhd6vsZuvWFudc/nPoD34Ty3vHdNJkrVAtSmkowVz1WDRUfi1lm5VmN3eIYOikIcA6L1QRyxL3Jvok9rNMBYdW/JiiQajF2yVlsimHTuI1ZcEMJwOsaI9qorekJarcMDoZ5ZgMrchqKenptRSylM+yAutV4TE902N/qpGV1XPd6vLjrz/xx/8+dg7h/hKkd+W462H87jmFKnnON1+vrnH045Ga6gjtcmcyAMoOSqxVKRYgJgxnF4Hfr7vGbvloAuWqCoxUmEcT1pWwuySotJNmpPXhNKexuxF1qkI06RXbDiq9RgPimVszJlmrMC2V1eRynoS4m4LDUrmRIYMAAs5MNxQBR+MLe6oL151w7Cc7XPQDcjR3i1X4yCt+EVOzm7m6bwQp5TaIGEcXeU1JHmWV355kFYIVFzkBXlWuq1MFYT8jV0GY4kHV/UcKrAjRtsRXbdyeQyiTAzWZirxLssebsw1QJMFit1GZpNI1pdVM8TF1Jar4P+kLZTgCCoqPNq/PmRnH0RBcHV0Ayt9+/yEP/EB0CgXbtuFACs9dF6Dd2xTzKsQVrzYVfPH5C2oCnuHUVNnF2iKoDYw6dr+qSVBTZlMlGznJsAjdcyqLM8FiSCU+hpFYd5HTKk1g8X/NNch15Mfkw1EqYaEqvGTEvORvTDWiBRXV0D+qUq18m/SJjOk9ejI15djrQZf23s6V4UdF9d03P/zYT1VuxwEWnLsexiftc+a3n85+/1Nohy0EkjkHRihyJUBybqpmOrX7oiaBWpJlaut+Tao64/81BzqFz7YUQjMVLMiB0IS8FUJpuEIsoKLxbDVtFiu0IUVhGmhYVp+g4wBlygdNXXHVMpE29QlSqCyVYaJUUtWh6RH9Ptjrg+0YWFne4yhfFOhH0JMP3fbQY7+zRunUQTvuvAbanVkGr0DTI/xIuxXBkQKhRRxYsuCcqDwy5UpamhfEBVBiIh8G1GU21TYX8RB6qG/gGqfORWxJjOBY4aMRXpjGA6y4XCVMYrEvLKmIqha/sODNJ/pMi0VsIwZD3lc1mX6DkosIlBIbQnlgNISOhiMdtzdRV78tw9GXxeOCXssv3vLoB19VaRsgdGo7yMJz5wVoXgUL9Dj78odB+Qu6sqTM/J5ukZ8RHcuDoWWhZGpFDcyaCoscLEFM3Z6C2kJ9G/7uBJgatOg1BKSBB7C0Vwl/FXx7Fbz/HoQr0d/sA74R0vvAxHKBzK4KxUihQ0II0UZVHYSh6CFwKXpRekfhezmkDioAvIp6kYZA24ASanYCScwnAkbQthLxMkgIob0HZBwKRVWoGEAgQnoQy6ryA3XuRmp7I7y/1guumRm21972syfcOoHL7dzpsHOnn2jxd1gIUGwmBG2eh9kN01jeMwTjexM9odij1LagQy0saKmW6szJyKlb30Mt5BUR6GAKmOoBvlXccpviymt7vPoGYGX5y9yw4Tx3wvHnjwZT38TWR+9d65u0P7Tjbf3vu7IS99aq3WYFZvPm1GXWIzY7wGHZJzpGGDzzW5/W6dmncbQySqXH3lLwSus3Tb5RTlVU4HFsNpLAQJOeUBqhCQ0ug8D0G2BlBbjhZvCKaz12/5vjldcR379hl7/5pjfi1o/8U/UQVYnFRQHmgLkuEApT5TQX/z1XvzZnzp2DYnFxjWc1t59qqTWOubnO9bHW9eJ14u8XXyw45RTFTgA3QTGX0KHDpy1xc6c6oJIe79h9IiBPwOqyJnQt226w7p1N2/jA5IFYsgShkZjWTZ5S0tgrtHHA7DQwHoFXXg39wlfBSy4Dv3ebxyob9KeWMd3/f/x33/0u+NjR4M8+02DbZm8ecov79nHY3/+dMGGbBVjw0gye5PvT6zheDmmLpG06tIeq9YHWnZIsY9PyUnJYrQoOGmB6BrjlFvDCi4ELvgJ86zvg0hLQo9d+X7hh6lYec9SL2gte9+kQ28wRuuixsGWMBRw5Dj8fCPCqT4FzwJjKqlFt5UKnKlFq7Bxhc+esukbkLqigb6HigHXT0B/cDH7kM+CuC4HrbgCaPnRmCrz/xgjicex7/CVc8LodOOXUHi4+bXSnzciR4xD4QAlhfde3PouZ2aewXY3oc136YgGN6NuooW/Q5DVzhKbehxLkddPA7beDn/ocsPMLwE03QfsC9KSkE8S17M32OJBX+X990xuK8Bw5Dl8BSsLzjgvWs/fgy9BzPw71LURoc4WM2EbJGyWanemSI1X3SOjYA4M+MHDgRRcDix8Hrv0edHYa7DXQto0RsIIUr02/IeUi/cbbnwi8yAGL7ZHlO9xN2LZtweC4BzwA1Pur9ybBWerWNXdln8D3mHM2HqWvWuuBdTPAjTeB7/0I8MV/hfYIbJgJXnjrYx+2dA3xlB7o9F0KBTbdSOw6sniHwyF3IEBRzKbvD8g0Vb3NYClKW+YqP8HCD0anWgKewPp1wBe+DL7mb4AvfhG6bhDCdO8LBCSpaE8AYQO0rW/k8wCAXZv9kaW7LwjQYlz98egYNAPGpm7ZzwlJI07wY+pWDzD9BQWY7oPv/yj41tOhK0vQ9TOxGkIAcYiDJQARkA5KF1BvkdvB6ZuiZB8Zz3SfisKczMIJ4KmmS0BFdZBuEz9bqqMahKMhePrZ0H/538D66Qj3aswPSZVzQsaXUv25OoxTmnsbcUeD1I4ch4EGSvJTmtLUfJ7U6aoqzy89mjOlQxzQCPgPZwG7PgdsnDXNdMSYPYkZ+ChQIlARgtJCmvXg6nHhTZcdmbR4XxIgqIyrtuamF4tWLUekGtyRTdqgB5xxHnDRl6D3Ww+02hEWVmYr5Byj/xMEqQ0mlFsAKDaddESA7lMChPFKoP+T2uk1w0qwOlxlD+j6afAjnwQ/93noUetjoZ9kLcMoNJDwbzUaKEd3pKi2IPFf8MQ/mMauTrn3keNwFaCA8Lba3Ia2TT1ETOs5Vk3/tO72EEL1iy8FPvbJEKJ7n1umZJMVTVUWmGS6WPyfQI7xIzTTj5BR8ypgweOUU5tDOoe1osZVP0ecaFgCPQDA/0BH7ZAOPaTRV1WzZlZekWpMht52G7j4YaDnSpmbJd2zDG9DR5Mxd1a1QjQeqzR/hie++vP4/OvPxylv7+Hilx8CNPqOsuFKYBsxdzJx424Cm8PLx9ykOGlOsdCpnsSPOhL9tu8exXXydTTywIxEC00TJktVjW1R1s+CZ38Q2Hk+dN1swHg6F9bK92FmCaIjPIUBKApxJN0eFf9CXPi6T2Nuu8PibgUW7h1saG57H0u4P2axjJOOXgIA3LzscP1exdxcnmuGOzvrdefmYAU2b/ZRsPRHKxeWBOnMa77IweAUjFfHcCKTmsO0gR9MAdd+D3jDmwBnSOvsWM3cVEHyfBmYoaDZpFX93ODBpiHdqpK/gwtf8y4AwKb5BrsW2oO4q4PKfe7p62Q8eI4OR7+svn004QiRfaHXt3qCQ3XNPjrZB+I2eP99QG5W534A6FVo5Gr4/jV40A034bQ1tGcSqmNuUizO+cNdoHhnyfQ886ozMLPhpVjZO1RhExHiPHQkz970Cp1dB5zxXuLzn1Osmynax5gnrQq5gwMNQ++gxYLEgJcBW/KgEzQDAfBOlcGfYNcfXV8EaVt70B/8s88+CssrvwTK77KZeSwgQLsc7tE1YUOkfruRqU94QFuAuBXirgPlStBdqoLdYHMpZPpbWNyyt6PxAsf5MBWmOxag+R0NFraM5d3feYVuuP9bsLJnqMImVzl0p7H1GugPbgX++k1Eu6oZ58ktT9hJvCZB7PhBycnudF4tDTKcUqjozTTw4+8p+ZeYWvcOfOL3V/ODP2m3YuEgmLb5eak+9/8659n0/pXw+guAA9qVodJ5Cl3ppkmALkyjdI2j6wOuHzAyKNCuqrreVRC5FCKfg7h/wbq9/4rTnrtvUpi2tvchAYqE+rOuegyl92WwlWx2zGIH7eOh69aBOz4HbD8Pum4mjhxgJQglWktVE4K6sY3UsIAVOquhxEGFLdn0KH34dnQJ6N6OnrwPn/rDG+MXEMydzIOwg4lN864ym88+dzNH/pWq/gWQHuGH47AJQnkFS6QZKPSUwJwM39/BNQ7NFOgG0HYIUK+Aa3bAyScwWD4fpz3jtnz1TTsa7NzcHmp6K+/KNEGefc0XMZh+rEY/KGmPzEL0gE5PAaefCez+KjA1BTufIAlKNfQ2J2NN7RVtUyrTzSt1rYr+UNi9uZ7UqzQ9SB9Ee71SzoCTd+KTf3B5tYMPhlaa2+4qAX32uf8RY/1TSPPMgJ+1Q1AcKKSUPGI23eW5eJBK16hSHKQXBIoK6PhqFXwcaM7Cu5/42XJtdTgJigX6w1eAkhk7+5o/8zMbX8NoxkpPHxSNMGqBN74ZuP1moOlVznLuFpo50JIFRRPrTKKQSKdZTxSe7GuRUErd3ydVbErTQzMF+NE+uOYzKu4c+I3/hE+89Payg+cbbIY/oMLUFdBnL87R62vRTP2EjpY8KC0prtSeSWBiimTthPgcQYIiPrYkI1yv0WYG8EMA7iK4ZhF05+Ed/+GaQylIvEt1Yed+71Fk81Vo6/IC0xTjDaahN9wEvPktQQAodVNkW7tuHmLJ7neirnyuVCkU5sJAVgIVzUWcfCsewgbSZ5jOM/4OGvc+OLeID/3OF6rvt2m+wc5tB84czKtgYRuABY/nffB+aMd/CsUrwGbAdjiCiEPcAImBQHGl/V826wIVSRtMQ06Qjs2MQzMAdHizOnceGvdWvOXRl2VB2g5/b5k23rWHQs9zrv8Ipmefg9W9pSdQqumanQUvvwJ453ugg2ay95wZgIZs/ix/SAw+mTSPZOGou52l8N868UWIEq02dpcEXK/HZgrajkCRL1LcB31/8DFs/9WvVs7xZScT2+cOzALMbXfZ4X3u4uPQypvo+k/CeHkMcYyJ4pzGKcFC1EZJE5GRGpyQe+dV6CGuz8EGoF1dVsrZgL4Bf/eYr2dBWjz4lal3uTbenXP103xv9tMYLbdwjnbqDdavB756KfSs94LTPcC36Paz1ggaTgqOyadlTSWmRw8n/CJYM5aBSCldPCqcCRpNSINeX+D6QDscK92/wuEc9Jr34eyXXnPgw2clNm1z2LUwxqlv7/G6H3s92Py/0LEq2ZJOlBK44XmzsErxoKDxgLgIDzjQUZX0gDQcbCD8cAnOvV116fV4y2NvwnyY6nowzRrvumqG8tzrd2BqdhOG+0YgHeKoIm7YAP3Cl4BzzwNnBgGRzlWnnWHl0Rm2jnU14z2E6kWjVOMHivDk12AjNaY2peV8IJsLBX2oiWQDNyVoetB2eCvICwF+AFPtx3HGr1+7Rvjs7zZQaR3t53/gJfTuNIisg7YjRTBpVmCyRopaKNNbXPKXJEerFBdm7IA9Tt+P1PZqAP+ff9Mj3l0P+zvUApS00Huv26KD2c/ocHmsAoG4oF3WzYIXXww96xxgdjb3KSFsQ4MOSGgcR7UTZ7JjLbliWmmiNhvqJyG0DVryA4a5hhgTl5SdeCUVzvXQDMLnt8MfQOR8dc2H4Xg+3rX1pgPkfKfQf4wX/OPjqTwPbB4KP4xCJKHeP2skA7KKSTwLgwaKzAVNvp+IQtiymeqjPwNg/I/ajl6FN/7Et4NJwwEHI3l3W9xx+/WLWP+AF2HvLSMVcfQtMD0FXH459IyzgMF0mhtdpSlsj8PiNLqOpqrpIlqF/OkBimErosKXJgRGSp6NnXFQiiiQTlRF2nBN6aMZhHPa9no4flgdz0PzkAtw2uNGGdrYuih3y8Rt2tFg15YxnvfB4+l6H1I2j+V4OARdo0LQOcNMYEXzrdkLUvzATAcWUMJ34fTGPtB+XxWvxP/68feuCYLe6wI0r4JtUHzkluM5dl+F6nptV8Py9PvQm24E3vHuon1ow3DUebHorwDOCIPVKpOmL4e7Vt2HMkatgMjUq0hcraEyxiSmaQ+g4ko/RIGqMszVlqbH/jTgRwB5KcUt+kYW8XfP+XqlmXffxRA6OdhzHzsa43YX2XuU+tEI4lxxqg0/XFgEJgtNjOJMxJadcgrUyRhNv89mBtquvhXfufBVWNw6rJz7e12AjCmTs6/5DV13/3fq8p4hHRp1DTAeA+94F3DrLUDTqybo2E5l2kWhMyU2+S7o+EXFuVSh4RUpsxaCaJcWoiwRjtoGENxP6qRy5iUIE11LwGnTc2wG0PFwlU3zWXXN2XD9D+FNW26tns3cnQyjsxB9+BEc9z6rwgcCvgVFGPsD1f5QCvetOTMClcP+KEziwmOVxnP6/j20K7uUSy/G6x5+w4GK0nhPpzDzrKv/Qe/3Y7+F1T1DgA1nZ4H3fxT4yleAQRMn3qAaPpR8nlIOVBYYliZi8CO74IwPTEVZ4z9xDrGNYnI0B+NsFy2VtWA3+jGplmxCBR4UD5Ee+9OENEA7+g4EH3BN7/3jNzz9f9daadsdo96BRTDG3Mc20bt/VvgwUZ5k8n2SUARz5qL5NsJjCHoan0/CmFLEBnLM2aP6aFd3K5d/Ea99yL8dCCHiPZuTsSjASY7ugTsxu+HndXnPkBs2NPja5dBzzwN6AvjWLLwzQ0k6jjQsuUzqvBmNUIkRGGMeqxo0ILMaM9lNxFBCjH9RBksUTEkc8uhBm39L13ZOQ2qdCtcEh7UdguQXPPke9Nrz8Ppn/OBOp08SMe6FH/3v7K17PYb7RiriKg1TmTUpEMaaQpQASpedcA11dmNMre8TvFrHS8/B646/5J5GaPd02Epo/fK+6x/G2fWfB+Ro+NEIq6tO3/YPwJ7bQzrDhqKWdE/WjaYsJiRrZOIlNRgXM7TFmCDpzKm0lSRVaJ/8KCtczIWSE2T/inUgaVxm0koKcS0Ix2bKBTM+vBaOZ6vvvRN/9ZTLsyDtF6BUYm5RcNKccvfHd4CDp0JHI6U4OklJ4zp8R9Q0iYzH7jkOcK6CBVQc6NxY+7N9UK9Du/x0/MWDv35PNNE9G7ZCemxXhxc96Eq3cusLoe0ejEY9Tvc8T/oJYDQEev1orppYcWEiIwskVmq6I0QdTMeLwYSqXRojEeeK0CbwUghmDCXOr2CNAFNKGF0GliZ/QrJmyvce0jUk0ICk+tUxxvtGcDhO+zN/xGZ8MV696zT86WdPxuLWkCpJPQzXosgu0Kv0/huorWrqwTQ5tZFxvoH6MhJCU28l1XoYErpTNtlgtG8EuGMhM/+E/3HVcVhkm0HHe1UDdfyh5uwrN7WzGz6M6cFG3r5n7E87V7C6AjgpzrRNvhoeUW4y1dVA6PgnlkdtKjhoIr3KEVaFGlyFFosSWUPDpGQusz/RPcfiWGkouzqa3c7Q8FvYw2CWGK8uw/XP0nH7Wrz2yd/NkWxXGyWn+kWf+BCa6eehXR3BBZCxONUp8ABj1W6MvmrMKCRpm/J71kr5eY0x2NDX8cqXIP7pwAP2rnlPB1UDpWMrW+zQZvzLD9vllpd+kWz2+Ice23DzU1qMWlAaaAxDU6lO0TRWAKKza6Ym592f8KAKXeakkAmrOjPEbq224qM8VBMKOxMSC4rwSEe4jGMLFwXJFQc23idDIlc82+UhqVPo91/GvnxB/vyiX8NCoG1gfl7W3NS9/hvRjhVQSQNgyrRDDf8zLYjtWIg840W789ZYmqurh0IbDPcMObXxcWj5bizQY9tOd2g0EOqhu27xus3+ARs+gJmZo/C2M4f6nWsbTPWBtkUpGzNOtJ3SJOxQQbm2L4I6/E4Jx8QA6FJjK4cb1gxJpd1s9IUOqb8UABj/TbpgZ2oKgeS4xpbgaOGaPgYzQDt+r956y2/jfz7jtsx0sGty6pca3PyDr6LpPwo6HpMiEEZTLMzIM0WrzWfNuAjomhpwjDAAxDAB6MaYuX8fKzf/Nl7zgLffVadaDqgAbeEYO3Y07dyxO5vvXLVJxitfxa+9uI/Z6TFW9qmlrqoZ/Z38mcwvMsJjkes1HVspkw6tpqDNlxktVmmpKnoxIGTWMjbVwpxGCIsZNI9WPlIRniox7Eg4aQC0GK0M0Z/+z7jfUZ/EX170ACzQ54k0wYwJTnvcCCI74QZxZm4c2RCVB70quzm5PFRPzUTqMjCPqlVvatM2zmG4t2Vv6n/iz295KLbeNX/owAoQAGzZMsZ2daPffNTX2nM+8hTI8HT+ygv66PeI0bBF44Iz7cqOqE2FRVmtr2MR6U49vSVj0fhSTrJQBm0h5VrZUe+aP4lCkUxgEYzcGdo40hR0Xs/DiKKJi6+74GqraIPhnhUMBj/HXvNhzF+6DttQxhrdeHSC7C+AtnFsoZoZaLp2X+IEkKZJjGa8Vh6h4LWm2Gi8kh96baY2wsvb7t0o7If5RKqCt23dq1vW/xYfuP6/8iUvWMVRR/cwHI3RNJpUrU8zwCa0ySTIVxHRbDQXBcMitilcL5rHLHzKygurzygC0/m8/FpHe1X3EB3qLCxrCWD8m2Ofo6VVrtv4ZN5vtA0L9Ni6WOrDAECndmO47FXV7QdCyV9LUWaJsTP7k2mAL8FuEahC03hOx5XbRxysfxYWbnkBFmJ0fa/7QPsbyruVLS4eniKXXPE32PnlTXr9DUDjhoCWLGoKVqVQNLTrAwFVIaKiLG6VRO0WKQpD0tQsfqbFWvMonciscs6Lj6bmfLU+nVhnm7XwVlFjXGHnAOqKjgaPwn97zNWhkDOG9S/4+LFoZDeER4FskbrcSxcstH0kJzP3SgllRpY662IdXvSrQAFd02KwrtHR8sV41Pon3tl0jBxUASI1RWg4pX/xn/36Tz1NNv/0H+DYo29V1+/H+t42+ypOjEmSbHasw1r7MmLGYEoe5Q3jUE9oGeeKdjLaQ501a2v8sIsJ0cw4tRqmo5kco7lOf0fok9QTguoxs25WBsNnA0AVBTVH7wO5L/HA0ywXO0mTakKvuk0BTCAGO3RYWU9IhEcZzDLe16I3/Th8/bb/FDCrO9ZCB1eArHOtKgukH//GY/5Wf/5Rj+PGmdPRNCP0Z3oxZG5J0drkSCiJT4hr5eBKbgOjRBEuE4WosOp6phZNTkLgXAz1pSMsySE22sSlnygYVkCceU80YYwCpU5CfyRnIAkh0IiiEfX93ikAgJM3lx0/3FPGOlZFmWU2pkJBXw9EU3tOnvatcRyH7zRohhkbGutqpAG0eVkcbYrDQ4DKjKvAJ3r5467QM3/tt9DvPxHq30fXA/ozPRVxAMLwkTziFFlQkB1ug8VAqlBcSXjbOiZGTBSZDOkroeyaS1b+lD2HTkCXtBbLGCcnBc12AjQuC1vWclHw6LJDTzhuROqGkkRoemoA5VTGcyLynMeZmxYPur/2IGlukprB1d6O+kQdkak6rO5TkM/EXywdh8Wt7X6wqkMgQNnBjjc1t91h8dSv6Id+e06FT4IfnQ7K7RjM9CGuAbQF0QY3RQqvpxOS5yYPRmPQaKOamFWH/7XwSAeRhgEMJXDehPm/QZs5BUU1O9oM2sZZ5zkKsjNsQhev1YiicQrFnjwzY1uUgWblaAAb4FvV1jMO/TGmy3TIzZCiidYUZZqrNXUwc0jiYD7CDHH14zEGM+vh9enhatvkwM5MPRBHykwn6V54+UUKXIS5f3g9ffvrEPdiuP4jAIH6MUgZBacxFYetAS52Ug5MPO3ktKrJ2kuXkIZO5h+FdxSjQhWbiqHWDrPTwIljTtJmgTYRIE0aJhYjEE6Ixn0ZALB7J3FZZM+Ohz/FZtDoaGUEqoOdMUsz6tz7CKRGIRIzqTiOPNQYx9PHGeKCaoqSJpPm44jOEBr/AoAzcPIP54AfwiZNHUG67GRiceu3FfhT/MoZr0PbPovavphO/hP7s0fBhR5T3o9bBsc7rIQwzwDPCHae4SGlKbEpjynRjKlrq7L/HWBSbISF0sM6+WASp4rTaL9YCq8sg+2sKSTo1Tmnq/v2omk+HC6+08cGooDXzSGoyGMVM+WXuXlpGoWuZXqzV8ClebFlWKQZ4FhDAckr9woVBbwKRisE9MmYv2EdtnJv5HbqvR/G352mBTsh2LVQxjb98pk/LpSnqeMvgHyiEg9DM4ibyyd3aawiPiZBwzJLdEyIUifNRLYPCc+8nSfCbCMsrjj0jOaKJsOfBE2dslBRQgTKkCdjBivFaSgQVA8RYnZjT/fc/gf4jZP+NnLNQ6PsV368z+t4iUrzSKAdMzhXJlcoOWyvgNX8e8WPjvfqYkTrIuc6pX8i8Sw3NXUKCNE4j9afgoX1l6yRbjlMNNDaGslbfgwWeI0HzgBwBk79xxmM9j4Gw9Wngvx5OjkJTk7AYDBN1wsPWNNH+DJsnfRIAiOi1eDUKGQ5yZvJAcoyPJfJIdWc4HUdlqQijDilRt+IgVsIU9ItQlB7GMyE9+29/bVGeNrgF7LFDR97JlzvkfSjsUIkDwdmmkKrWjRLNWXTeM+1P1TGsBdEW02IX5xtJURbNNM96N6fAHAJTt6/ojm8BMjyYxbjrCxVYvM2h2NO1tjq5CIAFykAnPqlHkbfOV6cPkJ19ZEAHwni4SCOg/IoEBvpZEbF9dQ1oGtyNKZSZ/JT9JR8pyp8li4RDZWT3B0ijChgFDHMRgB+CNLdrH50oQ7Hb8VvPPoTmJ+XakylKjH38f8OxxyEZ/zHK0DJHWOSiYrylH+vkOY8eiuYsCw0YienJ0CIkWsUNpt6/5NxXu59TYA6YGSeRKjEPIid2wSbt3kscATgyha4EsA/G1so+M2fncVGt0F1+n7Q1fXO+5kWqzPwMkMnfW3ViXPA2NM3qhiLSq+R0H0NBDwE9KCobxGwIoJ0bgxg5CkioKBVhYiC4uDHjk48GlFPkOgpKF5bT7TaAvI9dfw2XvqT11Y9B1Kpz+KWMV700ZewmX6yjldGFOe0E2uXAVtVZ/c8GdI2ykWcZp3fkQBF6abStHNu3ggPjr4Z7rsC1NVMCxE/3bUQHtX8PHHZycRJMQmJnaHo753YA2APgGvRGf3nO//FAfodd/bv8yo4eZGZNjG33WFxyxj/+Z8fjOHorzFebckuFTFY1TzCXu2Y9WSiaKZAGu1qErF5JK2WPp9UM66C5TxVzk4AnPdtAVpjTu7Cgu63n6HGiUOXncxqzCnmQsh8d4+1Hqj9vJM3K3bv5OR5i8DcnM+gai70m/PYtKPByp6z2PQfjHY0VEpDMdomC48aHnnyX1ACJWVJbaS/m7yeluKp4hcJKrcwJ/1Fezhgc+Pva4IFWkx/jYG3h8Ext91hYWuLeQi+8tgz2Uxv0fHKkGSTEqQhVRG/CO1kyHpaZBKyrERgmptO8D8UBRDo5NbMlGzFHRdK/qgK0OHfHXfTjmC25rZvxFcH74IbvEBHy0NSmtLuVqvGEgVQSo6v4ZIXyiuyTyxVVVLHa0piVxKxGu2uSiLo+70T2vWQpzL+vQtO6PSh2LVljBe8/7Ec9S8Amxeg3bcKoNEcXne6/6t9oWYeaoIsOonUnLawwEXiRKtPAyFrklmmuQDwiH0mNx/RQIcNQLq4tcXc9mkM3cvp8RoF18OvrBKusRzxycC5+EGFkaEFCKIRNGqmszLiPimUz1l4g2Kn17T06CZ8C6j/7hETdkj6Ts6XMQe7FsYZIJ3b3scyXowV/iFd/zEYL4P0Y4XrFac31vMrM0DIWJpUEp85zVULTmJ3VmFaRELSa11TpnU4z5QtG68ATr8NALhs8T4dhYUFAVBmTxyGxzEnaylhXtDKWX/u9pPQ6i9iqf0VuMGjCQCj5ZFmXq6JphjAPE09AyxpJ3XwD9U9BYFWwxeyUZehc2RCGmpeteUD5XdRHNrR7Wj3XgkAOGn3fUaAgrBsguCYk02r/xiq3xfGw2+ab7D+5AdjNH4MqE8G+XSMxv8BbmoAjMHx6giSmG4ojjLNAquZ9GixHoM0T5iwbjdcDRNKSYl0IMMJKqGasYCZd6RwA6Bd+SZ6p18HKLHAw1mAYt4rd2Bf0DgPLBw//Vez4N6jIfgxwB8L9h4gqlMgB56uESW9tl6kUU9VUDzgIUp6cTRNZRSuKcZeEGYPtL7kMiRm90OuQgEfWJEq4pMdIFQcFaB6sIHnLJysB+UoKh4E4gRd2Xc8XH8DpB9GG/ixUpeHGjtkqiKHy5rjGE05tRiua6wpM2ZGjNnK7dy0kwtTw1WVOmuuqBLrCUws+GEYsY6mDx2v7sTCgsf85gYLGB9uAkRgLunnNue9Tjm1h5VjToL4x0PxWCpOgr/lIQB/jHCzKv1cdozU/k4E1D581aFDc2addo6rlEac2YdwWrWMqbLZtl2elpA40T8IARrGoUbJvIwBHQPtcAQ/8mSYyQBlk6MbLZ9DE3Wp9yFXl0aFqu3kBiNcnV6SGb8po9hZTZNM8qZxZpsLeTUpAmeosKLjIeBH5wf/Z/NhxQci5rZL0DSLQWh+5o+Pxsg/leg9Ayv+KUT7U0DPKQvrW6GK1rfQYdoncbqmqyckGlxETZOo3IDKm6fbGUmuLapmV1WNmuUcU3JrGmR+Wy6AZG6oH9CUzP/IiI4BZXIxqxY9mUE9SVQvgCpReXTAP6kfrdpuNLkaxTjSJmqP95jzY4G9AIXrNRjvux5L+y4CgNBz+tALUBGcxa0tMC941L4thLwUq+2z4PoPBCXSLNsW43YIUhUikNTONTye7C8qY4bL5RWwgJvaEQkaH7Ba2qdhFKolaCGGvgbQ1lICZGEZVsRkG1xHjpttLpquaYDyUJdVBLQaRR0XXdOrtlttbKKlsPkwLUOPbc+PeJ1Uy8r8eyTkSxXet+jNOgz3fAxveuitmFMH/vAy53tBgOYcsBgE5zGvPgpj/1L4pV8H3M+GCoAR0A6H8WlJUKwMbQvooSqdqIEmfyMVPlIvguaihtw+EVp2f9YKkkeXGxUQ3+gVytBXB+xYjvJZiJSjiYYPKI0OaJ1h5j4JYVQWLdanpcd1MnVyR4V9tO1bShcSrJ3SoNqqjVBZHch54nS8pBitnp7zhouHDAdKbP6FFj/9qlkM5VSO/O8pm4eQY0DHLVrvlRACTVClzD01NSOrPnT1QN03qp7R6hksBmtsxCYIgXrXVtls04CzwkUSzSY5uJ1moWo4QDpBQzH32kkiVHVc7Hi5XfhQi+NbtUi21jAR2WpzywkUWw21lSUfRgUhrfamG4yWL8T/Ou7CwFO64yYLzcHTOgstALif/P05v8rXgM1PQUegXxmCiE1u1NE6lTkbKMqId6idsTqxjXzQIMFOZTtnOTRqvN9EsteUxaF2KqmYWH/F3ohREUVtWeilSFruz1iua0tvsltbNfPUWJCawEJfOpbkN3swamLrB9URluH7uBSFOdMR12KOmgUyfxnvA8tu7N8AUHGyCrBwhyvtDrzW+RcFdise+Xs/jaOe8veA/BmAH1M/XI2YekNWBdo1uEV0JvmyOwHBMO1ihASpG1JJt19iabDJqsWvHeRSuscSdWuZqtt9/gxLimA11ywtTIm0UPlDdhYsOz0jq0HDVc9sMZ1MumXZtn2gybObMRE5u2+7oeTREPQYrGswXLoYs8f/ITYDeMUWf8+nNt8trTMv8rBb/4d698cqbgZ+OIy7uSE9wz/FIlqV30KlKnPYwLqiIC2FdSjrdSzUTkyYDbLyhCq/h5ljA1Mmk6A9j+yswKYc1kpadbykQEA1gR8rX0xpTJqybBBvcCBKp1gwtroTVvkvGtOmOYla8CCyNmVhkpQP5SK+hSr/CAscY07dndE+BzAbP98Aiy0ecerD+dBbzldp/hw6nkK7OtQwdlesf2qTwFablFn0lha2FgyhHUqnSQgmkdRu2Um8rpa0gc1cq0XsYkcw2pJiTpYQ50J11TVER6v+PKb6quK7VSQu1N0M66/eYRWu5eyomnQFg/D4+tkYICBl5lvtrXc6XP4I/ub4z2RiP+6d9i6MmmeMh7zyefDTnwNlC9qVVQ1G1SHVYxMsfRGx5gKX+Dw2TNDqryVMNw8hEFhQNVeqiA20DkB6mD6TpyYp2JN15jk1oB1hq9rroTZzXR6XucfuFKxuK8xq09A28tHC4akEv/NBWtfRq2pFsC8jIbwqRTBaWQbxR1AlTpq7Sz0Sm3ue5Fxo5WGveLXCvQ5oAdVViDRQC3xFR1FqNjeTJsiqtxALFDH2zqVd0g2Qc+8/zZOj0akQn9irZi96qO8AhrbnoIEMFDWNgpPKISoVP3l9G47DIMLdsQ+W4JVMzoSprMPxKrZLSsuHUawF3bDUah9fDE65qrTsrevr6u1/gjc/8hu4+q63+5V7KDyeJ/7OWxS916kfjqE6AtlUBfthBwQRicQn7gfJSOBd8Wknd7Td+0zQIn3peF+13kIHA7H9T7TzlyQFJVTPIX2XBtEpfrA2iJWbbyBmYEK8taN9tcPIrb6rSWNRS+cNNf5O1i2GfKZd56l07BhjsL6P0d5P4s2PfGOZ5oOD3qEs5rEWPE/83XdApl6h7cpq3NWuMiW2g4hOLiAmVKzm0iiaUG0tXq+qma2RBqZQK+HSbjcu9aXioOb0FWiGZVpiylIzP3yDdndC81R7jli/RbXs9Pz22ntTrX2mpOlY+1+Y8IkUmpojJIHyEVlWH56nlmsUHyir/lal6XG073u6uvyyYLqgd2cUlLt7wrPY8sTfOQ2c+i3oyirIBsHFYcDmkxNDk8tkpdVRkkawEwdLeF2oCfYzaMJsihUi04wTNtTt+jhikoz1iIMssFJ/VjXsrrJlNsTuDJSxw4VTWz7UXWXRaVG3Vs9qdntgo/Nc8vPQurkETAdc25GEVKUjpGkx2vN8/N3PXILLTnZ426P9vdCpfj6kJU449W8V/ZepX14N/bZqonfuBKpaGxPWdtyW3RL1mIJknWzUVOi9pcSFHT6v2kVLIqFFwNT0yqFVDabtEnNZsGlfV6VIqmq+fK5aR9j2aZ6gs6/p+qJjNxMzNSuyGiKLApIjvXLt4s1506FVwYBveErPSbv8G/i7x+4KBY13f/TTXRCgTQ2wMMbxL/9jcur34VdWAW20fMPuvMpEzjUhbZ234ZphSKr5LtllZTfRpTVPJpruKtLO5HPbM3oy+GFHg5X0QYmYtNvNYjKELOpHiwdG6/pW9edAR+ImIsASAmrnOrUwq3UXVI2JrHdJ2IvaojfT43Dfq/zbfvpszGsYfHcPDrnzIOGuMY572QvJ5i/VD4fJ/OUuoDnErGu6uyAzOz5B5U+YWfIm8sYahmh/7biyD2BpokGDq5kGXefDjNOt1NzpshOuqzEZuobu0LWk03jM3qiT7ujV6ETrGlGm7qeFCmv3v5yvoPdZWCMIq/S+5WBjH8u3vtmf9jNvwPyOBgu8R8JzJwVoXoDFFg/57Z+k9E4H2jb5N7mtf5ULrn2Y0E29q7p14pnXeUVW0Y6uhZmo6UQfv0ZAjGsAj10RMfPnbWTFDpjIiQ3AGnlhB+vhJLA3YabUfn5y6ifjM+5fNEsEqTqhwVNElgevIFt6r/31fd1361v1HY/7/VDQuPmATCyUO3aaLyNOObWHcftuEBsJbUkKySo3UwXZ7AbeNTrLTm6Uaz2ytYBGmxXMobZpNar1+xU0/QFZaQYasddK7IlOPraDtXDtGR3m3ZYxkK+fmpKbED2c79ci+U6o74JB+U5xIDA5MCI1jWq9eg/21vUw3PsavPNxr8S8yj0fZX6nBShEXLgBr6YMnggdr4J0tsNj7lFs28Spp8I6d3k/aMlPm+VmXZKr3QSrcnKxsgWMUQ06NE6UlEQKa/cPJplkCBmdN9ZGV7sQYY17F6yG1e6oiom1zPIwJRAG+1HbS6HSXApbclz/TAx0UgC+bQE0lEa4etsr8M7Hz2NOXWhOceAmN8sdmq4H/9bPEPIn8KMRQJd3fL6NKBSGOmqExGzaKB5Uq8qLcWB5nBmyn9AYFc426YnQJAytKBXKZnE60Wk8OWGO2IERTGvdjn9kyKx2BkVWx2QHhrDZ97UMV+c6RNfhXiMvV4vWGM1UD5TbtN37Iv+eJ///Idpie6DHfv8QAbqMwLyQfJNSBvGB0CxKYs7kWkdGs1EESTvhveUyWTsXEWCtz63TQVwjsWgjlknUmugmY7Xqyz2RtLVtcauup3XhXf2RWsVExdGWzr0zwww1iNlByrnGKLpcNGjgnio/ltO1CtUWvXV9RfsljPf9R5z59A/kMeMH4ZAfSkP98WtfAjd4KnUcoq4ovD4QvbRLoYiMVI0cSU56QLFgRas8d1n/NKqpg+tUSQfNzypIsJo0Y46SWdEzapFiR32xWmB2pt9UAqKoaqzKRCFjqkpUmTnceWQUaloGlRMZV9t+pZhgI2q270L2/RTw45ZKh/66HvzSO7F87VNxzjO+hjl1B0t49tdkMzyO+//Kek5NfxniHgboOFDiCkpaSlloHL+EgCpDRo81nmcIWZnULmKIVyUyssBjGfskRR1IvJaQoDMdKtAhY3XmbnSBFzFIb/Sl1LRPRPVedohoYpoR0CDfUoOidk5ZNvWd0eMQ027YIuSxfMn2tk6FiOENHqBqf7YHHX0fbF+Ns552+kQHtIN0yNpoMxVTg5dD+g+HtsNQotJxanOm2gPwYR9W6ebCrFNll/UTn3+d6tROclM71AmmEgZatYFJJDjlf2iFaKIQPOMzatvdWlxmranRle+SA2ejJFlFo8UJ9+X7dHJ/NGU3WINHoGuArbn1nzQN+jM9+tV/xHjpiTjraaeHeV/Kgy08+6fTHT03y/7Gr4Fyomrbkml7iHaJwJlvHifoVbvRUEVBT8Uak5btY0/jCFDXYaWcUIW/VHiOrAFOSikWtJN7bIK1S1k1dWFqCAFKMeOnuggmNeXk4uRAZrNo83ow81atRoHUnKXOfVQOfeqID7RKadhfR7Qr/0bhvD/n6WfmXosH0WTdAR9okwN2jWVw1Jyy9xD1KyMArkwh8jTIgyK3W+N+5DF3z2KXWsEO22EiW6QdynEirNszq5Le5A+I0RY2XcW1UwakcUVNJEjWpAGuyQPSCkbtlnPYb5a0kaKulkVd04WJBlAGEIR6eooO1vWow73wK29RWfkrPec5t5Su//ee8KwhQLtaYF5Ur/vtSA6LLEItndJL7Xad+zJagJ3ylW7GociBmhot1v380C3dpSnPWWuhpJoloVUtcu32mKTGGpequlZmhiBtcVZ2A4lSN7yfe4Z0/C6ZeBgdMm6nQgyqRAv4HppZBz/0bFfOUbf65zj3ud+oWuUdgqPpRl7NCdc8qdXe49SPWgabZOq0TB0uqySkFlxDq4w2Kv3DKB8aay5rc6Ds7NgsaVJyWpVmQ1UkaHd6JTdcA3Aja/2Y7yi9yxeqxhptdWGMrVapXC2he82mjb17jAtpat1TfVlRvOqh8CD7aKad+tVV+NX3K8ZvxvZnX1S6u875u8oiPEgCdCODcW1eAjRCjIdKbVhnp2JPPTXRzVrk906aGaK0e4wSIQsNVSeQ0gwb9Xz5OouuJfqbKLwo91OuHusz1IzNNFydEheqcdtz+kMTw6mmjtKkjWGZkOw2Eytd6u37tRQlSkdlqyol8GIpvQauD7QrN7NdOU9F/x7vf94lObrCNhwqrbOWABHYNcaJvzaFkf8FcBScCXbpo/VDqXjDVfazhKGVMz0x691iNgmILDBkt16qJjWqqa2k8S/Yqbhgp4SItoSoasbUTXEV/EbrunSEEZqKupl3TbXocJ86LID8sS6l5hWg66GZctAWwPhrVH+W15Vz8aGXXJ01Thj/4HGYHE2V82oHTwD14dBRC4YguzioSSAEBQKzEYJJCBBdEmWed6KFDtax+RIrO0WVJIxgxBlGRBazLFBkSk/kuL0mqbLiHJv+gHmiT02ar2YqZY0lBmjkBLG+az5zgpna4fBE/Sb0EXhwQK+B9KNAj27EePlT2shZuOr7n9aLXz4qgrNbDweNsx8BujEGWeNnQaaoobl/w64Hmjc0qyIRrpWhRqcEVzvry5C1VKYmCKW4jixoTslDxQkE6ZzKoQ2Ffxr6u5lKUil3oUagmVyPXHBk5kmkCLDABZap3eV7WWedlcOjqWBdy3ALOpXGwfUcKKAOAT/+rvrxBWD7Tzo7OB+LczdV3c52bWsPpY9zZ3Gg8KyO+y8XgM0TQpckOMQxeWrGIjG1xMp4hllmdiCw7PVKZhZGBFZTfBHw7W6ZrjO16RnX0SxZHf+rdpil+qm1ix0USgbusxgNavJqudxHih+TfSeJ0pRYk5JR7CCePrQ4cw6QBpReuJd2CILXKHEpvP8cer3PYNZdgsWte6vm4wCwuNWv2W3hMOxJKMCCx4N//Xiyf1VSp5WCpgHsKjUt3aoVo6ZMYyeWRGLdnMloMGEZRV17ncYXqekcGgHZ3NELduaXGEBOq2QmO0ZU0zjsKkpD6cmT684NnpOnNbtSV6ZhzJT6EajtHlC+D/C7EFxOyte8yJfRrlyG819+20THegAHkqdzCKKw0QzUvQ/tclhXrwphC+U4aoEGHi40iIydvxAn/VJ9hJJ7UWd4DbkqAmxBjAAIhC4qEA0wMclU7RYm2GropSJUhVCgUPo4752ARPIzXdjlEi2EmUQSGi3ETAHDSMmAPYxAKjUW3UsBFejFB/mQJvc7CarVh091DQhXJgdJS4m7SdweSHMbvF9SbX8A566Fb69RuutxW3sTLn75vglWYeobnRqJHsYm6u4kU48cOAhNRG/czbrz7I/GwbUbXx6iYw71QJS5tf64Vr/fuf296eAf3b7Vx5wcWxLvVmCb/igJy5HjyHHkOHIcOY4cP0LH/wGHjN4SL6XpqwAAAABJRU5ErkJggg==";

// Teks cari-ganti dibuat toleran terhadap spasi/indentasi dan baris baru.
const ws = (s) => new RegExp(s.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/\s+/g, '\\s+'), 'g');

const patches = [
    // ---------- nav-types.ts ----------
    {
        file: `${M}/nav-types.ts`,
        name: 'ikon menerima prop "active"',
        re: ws("export type NavIcon = ComponentType<{ className?: string; strokeWidth?: number }>;"),
        to: "export type NavIcon = ComponentType<{ className?: string; strokeWidth?: number; active?: boolean }>;",
        count: 1,
    },

    // ---------- use-nav-config.ts ----------
    {
        file: `${M}/use-nav-config.ts`,
        name: 'impor ikon lucide diganti nav-icons',
        re: /import\s*\{[^}]*\}\s*from\s*'lucide-react';\s*import\s*\{\s*HomeIcon\s*\}\s*from\s*'\.\/home-icon';/g,
        to: `import { HomeIcon } from './home-icon';
import {
    AwardIcon,
    BuildingIcon,
    CalendarIcon,
    PersonIcon,
    TicketIcon,
    VoteIcon,
    WalletIcon,
} from './nav-icons';`,
        count: 1,
    },
    {
        file: `${M}/use-nav-config.ts`,
        name: 'menu Berita diganti Saya (tamu)',
        re: ws("{ label: 'Berita', href: '/berita', icon: Newspaper },"),
        to: "{ label: 'Saya', href: '/login', icon: PersonIcon },",
        count: 1,
    },
    { file: `${M}/use-nav-config.ts`, name: 'ikon Award', re: /icon: Award\b/g, to: 'icon: AwardIcon', count: 1 },
    { file: `${M}/use-nav-config.ts`, name: 'ikon Building2', re: /icon: Building2\b/g, to: 'icon: BuildingIcon', count: 2 },
    { file: `${M}/use-nav-config.ts`, name: 'ikon CalendarDays', re: /icon: CalendarDays\b/g, to: 'icon: CalendarIcon', count: 3 },
    { file: `${M}/use-nav-config.ts`, name: 'ikon Ticket', re: /icon: Ticket\b/g, to: 'icon: TicketIcon', count: 2 },
    { file: `${M}/use-nav-config.ts`, name: 'ikon Vote', re: /icon: Vote\b/g, to: 'icon: VoteIcon', count: 1 },
    { file: `${M}/use-nav-config.ts`, name: 'ikon Wallet', re: /icon: Wallet\b/g, to: 'icon: WalletIcon', count: 1 },
    {
        file: `${M}/use-nav-config.ts`,
        name: 'baca status login dari props bersama',
        re: /panelOwner\?: boolean;\s*\}>\(\)\.props;/g,
        to: `panelOwner?: boolean;
        auth?: { user?: unknown } | null;
    }>().props;`,
        count: 1,
    },
    {
        file: `${M}/use-nav-config.ts`,
        name: 'Saya untuk yang sudah login ke halaman akun',
        re: /if \(variant === 'public'\) \{\s*return PUBLIC;\s*\}/g,
        to: `if (variant === 'public') {
        // "Saya": tamu ke halaman masuk, yang sudah login ke halaman akun.
        if (!shared.auth?.user) {
            return PUBLIC;
        }

        return {
            ...PUBLIC,
            right: PUBLIC.right.map((i) =>
                i.label === 'Saya' ? { ...i, href: '/profil/edit' } : i,
            ),
        };
    }`,
        count: 1,
    },

    // ---------- ios/bottom-nav.tsx ----------
    {
        file: `${M}/ios/bottom-nav.tsx`,
        name: 'iOS: impor ikon Menu',
        re: ws("import { Menu } from 'lucide-react';"),
        to: "import { MenuIcon } from '../nav-icons';",
        count: 1,
    },
    {
        file: `${M}/ios/bottom-nav.tsx`,
        name: 'iOS: ikon tab lebih tipis + status aktif',
        re: ws('<Icon className="h-6 w-6" strokeWidth={active ? 2.2 : 1.6} />'),
        to: '<Icon className="h-6 w-6" strokeWidth={active ? 1.9 : 1.5} active={active} />',
        count: 1,
    },
    {
        file: `${M}/ios/bottom-nav.tsx`,
        name: 'iOS: ikon Menu',
        re: ws('<Menu className="h-6 w-6" strokeWidth={1.6} />'),
        to: '<MenuIcon className="h-6 w-6" strokeWidth={1.5} />',
        count: 1,
    },

    // ---------- android/bottom-nav.tsx ----------
    {
        file: `${M}/android/bottom-nav.tsx`,
        name: 'Android: impor ikon Menu',
        re: ws("import { Menu } from 'lucide-react';"),
        to: "import { MenuIcon } from '../nav-icons';",
        count: 1,
    },
    {
        file: `${M}/android/bottom-nav.tsx`,
        name: 'Android: ikon tab lebih tipis + status aktif',
        re: ws('<Icon className="h-6 w-6" strokeWidth={active ? 2.2 : 1.7} />'),
        to: '<Icon className="h-6 w-6" strokeWidth={active ? 1.9 : 1.6} active={active} />',
        count: 1,
    },
    {
        file: `${M}/android/bottom-nav.tsx`,
        name: 'Android: ikon Menu',
        re: ws('<Menu className="h-6 w-6" strokeWidth={1.7} />'),
        to: '<MenuIcon className="h-6 w-6" strokeWidth={1.6} />',
        count: 1,
    },

    // ---------- pages/home-mobile.tsx ----------
    {
        file: `${M}/pages/home-mobile.tsx`,
        name: 'teks "SIMPLE." diganti logo S',
        re: /<span className="text-\[17px\] font-semibold tracking-\[0\.28em\]">\s*SIMPLE<span className="text-indigo-500">\.<\/span>\s*<\/span>/g,
        to: `<Link href="/" aria-label="SIMPLE" className={'flex items-center ' + PRESS}>
                                <img
                                    src="/logo-s.png"
                                    alt="SIMPLE"
                                    width={36}
                                    height={36}
                                    className="size-9 object-contain dark:drop-shadow-[0_0_10px_rgba(56,189,248,0.35)]"
                                />
                            </Link>`,
        count: 1,
    },
    {
        file: `${M}/pages/home-mobile.tsx`,
        name: 'ikon cari ditambahkan di kanan (tamu)',
        re: ws('<div className="flex shrink-0 items-center gap-1">'),
        to: `<div className="flex shrink-0 items-center gap-1">
                            {!user && (
                                <Link href="/events" aria-label="Cari event" className={'flex size-10 items-center justify-center rounded-full ' + MUTED + ' ' + PRESS}>
                                    <Search className="size-[22px]" strokeWidth={1.8} />
                                </Link>
                            )}`,
        count: 1,
    },
    {
        file: `${M}/pages/home-mobile.tsx`,
        name: 'ikon bulan/matahari sedikit lebih besar',
        re: ws('{dark ? <Sun className="size-5" /> : <Moon className="size-5" />}'),
        to: '{dark ? <Sun className="size-[22px]" strokeWidth={1.8} /> : <Moon className="size-[22px]" strokeWidth={1.8} />}',
        count: 1,
    },
    {
        file: `${M}/pages/home-mobile.tsx`,
        name: 'tombol Masuk dihapus',
        re: /\{user \? \(\s*<NotificationBell \/>\s*\) : \(\s*<Link href="\/login"[^>]*>\s*Masuk\s*<\/Link>\s*\)\}/g,
        to: '{user && <NotificationBell />}',
        count: 1,
    },
];

const newFiles = [
    { file: `${M}/nav-icons.tsx`, text: ICONS_SRC, enc: 'utf8' },
    { file: 'public/logo-s.png', text: Buffer.from(LOGO_B64, 'base64'), enc: null },
];

function fail(msg) {
    console.error('\n[BATAL] ' + msg);
    console.error('Tidak ada berkas yang diubah.');
    process.exit(1);
}

// 0. Pastikan dijalankan dari akar proyek
if (!fs.existsSync(path.join(ROOT, M))) {
    fail(`Folder ${M} tidak ditemukan. Jalankan skrip ini dari akar proyek (yang berisi folder "resources").`);
}
if (fs.existsSync(path.join(ROOT, M, 'nav-icons.tsx'))) {
    console.log('Navbar sudah terpasang sebelumnya. Tidak ada yang dikerjakan.');
    process.exit(0);
}

// 1. Baca semua berkas dan terapkan semua perubahan di memori
const contents = new Map();
for (const p of patches) {
    const abs = path.join(ROOT, p.file);
    if (!contents.has(p.file)) {
        if (!fs.existsSync(abs)) fail(`Berkas tidak ditemukan: ${p.file}`);
        contents.set(p.file, fs.readFileSync(abs, 'utf8'));
    }
    const src = contents.get(p.file);
    const found = (src.match(p.re) || []).length;
    if (found !== p.count) {
        fail(`Bagian "${p.name}" di ${p.file} ditemukan ${found} kali (seharusnya ${p.count}). Berkas itu mungkin sudah berubah.`);
    }
    contents.set(p.file, src.replace(p.re, () => p.to));
}

// 2. Cadangkan berkas lama
const stamp = new Date().toISOString().replace(/[-:T]/g, '').slice(0, 14);
const backupDir = path.join(ROOT, `.navbar-backup-${stamp}`);
for (const file of contents.keys()) {
    const dest = path.join(backupDir, file);
    fs.mkdirSync(path.dirname(dest), { recursive: true });
    fs.copyFileSync(path.join(ROOT, file), dest);
}

// 3. Tulis semuanya
const written = [];
for (const nf of newFiles) {
    const abs = path.join(ROOT, nf.file);
    fs.mkdirSync(path.dirname(abs), { recursive: true });
    fs.writeFileSync(abs, nf.text, nf.enc ?? undefined);
    written.push(nf.file);
}
for (const [file, text] of contents) {
    fs.writeFileSync(path.join(ROOT, file), text);
    written.push(file);
}

console.log('Selesai. Berkas yang dibuat atau diubah:');
for (const f of written) console.log('  - ' + f);
console.log(`\nCadangan berkas lama: ${path.basename(backupDir)}`);
console.log('Jika memakai "npm run dev", tampilan langsung ter-refresh. Kalau tidak, jalankan "npm run build".');
