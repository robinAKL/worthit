/** Cari Cars (cars.cari.co.nz). robots disallows /motor/view/* and /mobil/view/*, which are the vehicle detail pages. */
export default {
  id: 'cari-cars',
  name: 'Cari Cars',
  origin: 'https://cars.cari.co.nz',
  kind: 'vehicle',
  enabled: false,
  disabledReason: 'robots.txt disallows the vehicle detail pages (/motor/view/*, /mobil/view/*)',
};
