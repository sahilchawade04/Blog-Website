import pymysql
pymysql.install_as_MySQLdb()

# Monkey patch version to satisfy Django's mysqlclient requirement
try:
    import MySQLdb
    if MySQLdb.version_info < (2, 2, 1):
        MySQLdb.version_info = (2, 2, 1, 'final', 0)
        MySQLdb.__version__ = '2.2.1'
except ImportError:
    pass
